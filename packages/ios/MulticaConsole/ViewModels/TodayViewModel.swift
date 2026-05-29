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

    func fetchData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let agentsTask = APIClient.shared.fetchAgents()
            async let reviewTask = APIClient.shared.listIssues(filters: (status: "in_review", limit: nil))
            async let blockedTask = APIClient.shared.listIssues(filters: (status: "blocked", limit: nil))
            async let doneTask = APIClient.shared.listIssues(filters: (status: "done", limit: 5))

            let (agents, reviewResponse, blockedResponse, doneResponse) = try await (agentsTask, reviewTask, blockedTask, doneTask)

            activeRuns = agents.filter { $0.status == .running }
            reviewQueue = reviewResponse.issues
            errors = blockedResponse.issues
            recentCompletions = doneResponse.issues.sorted { $0.updatedAt > $1.updatedAt }
        } catch {
            // API errors surfaced through empty states
        }
    }
}
