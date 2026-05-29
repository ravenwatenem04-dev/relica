import Foundation
import Observation
import UIKit

enum EventStreamConnectionState: Sendable {
    case disconnected
    case connecting
    case connected
}

struct SSEEvent: Sendable {
    let type: String
    let data: Data
}

@Observable
@MainActor
final class EventStreamService {
    private(set) var connectionState: EventStreamConnectionState = .disconnected

    private let session: URLSession
    private let baseURL: URL
    private let keychainService = "ai.multica.console"
    private let tokenAccount = "authToken"
    private let handledEventTypes: Set<String> = ["agent_status", "issue_created", "issue_updated", "run_completed"]

    private var streamTask: Task<Void, Never>?
    private var reconnectTask: Task<Void, Never>?
    private var eventHandlerTask: Task<Void, Never>?
    private var lifecycleTask: Task<Void, Never>?
    private var manualDisconnect = false
    private var reconnectDelaySeconds = 5

    init(session: URLSession = .shared) {
        let baseURLString = ProcessInfo.processInfo.environment["MULTICA_API_BASE_URL"] ?? "http://localhost:3001"
        self.baseURL = URL(string: baseURLString) ?? URL(string: "http://localhost:3001")!
        self.session = session
    }

    func start(
        onStateChange: @escaping @MainActor (EventStreamConnectionState) -> Void,
        onEvent: @escaping @MainActor (SSEEvent) async -> Void
    ) {
        manualDisconnect = false
        observeLifecycle(onStateChange: onStateChange, onEvent: onEvent)
        connect(onStateChange: onStateChange, onEvent: onEvent)
    }

    func stop() {
        manualDisconnect = true
        lifecycleTask?.cancel()
        disconnectInternal()
    }

    private func observeLifecycle(
        onStateChange: @escaping @MainActor (EventStreamConnectionState) -> Void,
        onEvent: @escaping @MainActor (SSEEvent) async -> Void
    ) {
        lifecycleTask?.cancel()
        lifecycleTask = Task { [weak self] in
            guard let self else { return }

            async let enterBackground: Void = {
                for await _ in NotificationCenter.default.notifications(named: UIApplication.didEnterBackgroundNotification) {
                    await self.handleDidEnterBackground()
                }
            }()

            async let enterForeground: Void = {
                for await _ in NotificationCenter.default.notifications(named: UIApplication.willEnterForegroundNotification) {
                    await self.handleWillEnterForeground(onStateChange: onStateChange, onEvent: onEvent)
                }
            }()

            _ = await (enterBackground, enterForeground)
        }
    }

    private func handleDidEnterBackground() {
        disconnectInternal()
    }

    private func handleWillEnterForeground(
        onStateChange: @escaping @MainActor (EventStreamConnectionState) -> Void,
        onEvent: @escaping @MainActor (SSEEvent) async -> Void
    ) {
        guard !manualDisconnect else { return }
        connect(onStateChange: onStateChange, onEvent: onEvent)
    }

    private func connect(
        onStateChange: @escaping @MainActor (EventStreamConnectionState) -> Void,
        onEvent: @escaping @MainActor (SSEEvent) async -> Void
    ) {
        guard streamTask == nil else { return }
        reconnectTask?.cancel()
        reconnectTask = nil
        connectionState = .connecting
        onStateChange(.connecting)

        streamTask = Task { [weak self] in
            guard let self else { return }
            do {
                let events = try await self.openEventStream()
                await MainActor.run {
                    self.connectionState = .connected
                    self.reconnectDelaySeconds = 5
                    onStateChange(.connected)
                }

                for await event in events {
                    if Task.isCancelled { break }
                    await onEvent(event)
                }
            } catch {
                if Task.isCancelled { return }
                await MainActor.run {
                    self.connectionState = .disconnected
                    onStateChange(.disconnected)
                }
                await self.scheduleReconnect(onStateChange: onStateChange, onEvent: onEvent)
            }

            await MainActor.run {
                self.streamTask = nil
                if self.connectionState == .connected {
                    self.connectionState = .disconnected
                    onStateChange(.disconnected)
                }
            }
        }
    }

    private func disconnectInternal() {
        reconnectTask?.cancel()
        reconnectTask = nil
        streamTask?.cancel()
        streamTask = nil
        eventHandlerTask?.cancel()
        eventHandlerTask = nil
        connectionState = .disconnected
    }

    private func scheduleReconnect(
        onStateChange: @escaping @MainActor (EventStreamConnectionState) -> Void,
        onEvent: @escaping @MainActor (SSEEvent) async -> Void
    ) async {
        guard !manualDisconnect else { return }
        guard reconnectTask == nil else { return }

        let delay = reconnectDelaySeconds
        reconnectTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: UInt64(delay) * 1_000_000_000)
            await MainActor.run {
                self.reconnectTask = nil
            }
            await MainActor.run {
                self.reconnectDelaySeconds = min(self.reconnectDelaySeconds * 2, 30)
            }
            await MainActor.run {
                if !self.manualDisconnect {
                    self.connect(onStateChange: onStateChange, onEvent: onEvent)
                }
            }
        }
    }

    private func openEventStream() async throws -> AsyncStream<SSEEvent> {
        guard let url = URL(string: "/api/events/stream", relativeTo: baseURL) else {
            throw APIClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")

        if let token = KeychainHelper.read(service: keychainService, account: tokenAccount), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (bytes, response) = try await session.bytes(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.unknown(NSError(domain: "EventStreamService", code: -1))
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            if httpResponse.statusCode == 401 {
                throw APIClientError.unauthorized
            }
            throw APIClientError.httpError(statusCode: httpResponse.statusCode, message: "Event stream connection failed")
        }

        return AsyncStream { continuation in
            eventHandlerTask?.cancel()
            eventHandlerTask = Task {
                var buffer = ""

                for try await line in bytes.lines {
                    if Task.isCancelled {
                        continuation.finish()
                        return
                    }

                    buffer += line
                    buffer += "\n"

                    if line.isEmpty {
                        if let event = parseEvent(from: buffer) {
                            continuation.yield(event)
                        }
                        buffer.removeAll(keepingCapacity: true)
                    }
                }

                continuation.finish()
            }
        }
    }

    private func parseEvent(from payload: String) -> SSEEvent? {
        var eventType: String?
        var dataLines: [String] = []

        payload.split(separator: "\n", omittingEmptySubsequences: false).forEach { rawLine in
            let line = String(rawLine)
            if line.hasPrefix("event:") {
                eventType = line.replacingOccurrences(of: "event:", with: "").trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                let dataLine = line.replacingOccurrences(of: "data:", with: "").trimmingCharacters(in: .whitespaces)
                dataLines.append(dataLine)
            }
        }

        guard let type = eventType, handledEventTypes.contains(type) else { return nil }
        guard let data = dataLines.joined(separator: "\n").data(using: .utf8) else { return nil }
        return SSEEvent(type: type, data: data)
    }
}
