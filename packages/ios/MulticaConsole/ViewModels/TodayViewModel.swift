import Foundation
import Observation

@Observable
@MainActor
final class TodayViewModel {
    private(set) var activeRuns: [Agent] = []
    private(set) var reviewQueue: [Issue] = []
    private(set) var errors: [Issue] = []
    private(set) var recentCompletions: [Issue] = []
    private(set) var isLoading = true
    private(set) var streamState: EventStreamConnectionState = .disconnected

    private let apiClient = APIClient.shared
    private let eventStream = EventStreamService()
    private var isStreamStarted = false

    func fetchData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let agents = apiClient.fetchAgents()
            async let issues = apiClient.fetchIssues(limit: 100)

            let (allAgents, allIssues) = try await (agents, issues)

            activeRuns = allAgents.filter { $0.status == .running }
            reviewQueue = allIssues.filter { $0.status == "in_review" }
            errors = allIssues.filter { $0.status == "blocked" }
            recentCompletions = allIssues
                .filter { $0.status == "done" }
                .sorted { $0.updatedAt > $1.updatedAt }
                .prefix(5)
                .map { $0 }
        } catch {
            // API errors surfaced through empty states
        }
    }

    func startLiveUpdatesIfNeeded() {
        guard !isStreamStarted else { return }
        isStreamStarted = true

        eventStream.start(onStateChange: { [weak self] state in
            self?.streamState = state
        }, onEvent: { [weak self] event in
            guard let self else { return }
            await self.handleEvent(event)
        })
    }

    func stopLiveUpdates() {
        eventStream.stop()
        streamState = .disconnected
        isStreamStarted = false
    }

    private func handleEvent(_ event: SSEEvent) async {
        switch event.type {
        case "agent_status", "issue_created", "issue_updated", "run_completed":
            await fetchData()
        default:
            break
        }
    }
}
