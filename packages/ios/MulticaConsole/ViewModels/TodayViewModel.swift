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

    private let apiClient = APIClient.shared

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
}
