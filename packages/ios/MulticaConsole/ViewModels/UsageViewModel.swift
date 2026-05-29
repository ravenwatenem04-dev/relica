import Foundation
import Observation

enum UsagePeriod: String, CaseIterable, Identifiable, Sendable {
    case sevenDays = "7d"
    case thirtyDays = "30d"
    case ninetyDays = "90d"

    var id: String { rawValue }
}

struct UsageSummary: Codable, Sendable {
    let totalRuns: Int?
    let successRate: Double?
    let estimatedCost: Double?
    let topAgents: [TopAgent]?
}

struct TopAgent: Codable, Identifiable, Sendable {
    let agentName: String?
    let runCount: Int?

    var id: String {
        "\(agentName ?? "unknown")-\(runCount ?? -1)"
    }
}

@Observable
@MainActor
final class UsageViewModel {
    private(set) var summary: UsageSummary?
    private(set) var selectedPeriod: UsagePeriod = .sevenDays
    private(set) var isLoading = false
    private(set) var error: String?

    private let apiClient = APIClient.shared

    func loadSummary() async {
        isLoading = true
        error = nil

        do {
            summary = try await apiClient.fetchUsageSummary(period: selectedPeriod)
        } catch {
            summary = nil
            self.error = "Unable to load usage data"
        }

        isLoading = false
    }

    func updatePeriod(_ period: UsagePeriod) async {
        guard period != selectedPeriod else { return }
        selectedPeriod = period
        await loadSummary()
    }
}
