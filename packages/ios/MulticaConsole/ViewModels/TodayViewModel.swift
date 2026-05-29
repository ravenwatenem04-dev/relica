import Foundation
import Observation

@Observable
final class TodayViewModel {
    var activeRuns: [Agent] = []
    var reviewQueue: [Issue] = []
    var errors: [Issue] = []
    var recentCompletions: [Issue] = []
    var isLoading = true

    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func fetchData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let agents = apiClient.listAgents()
            async let review = apiClient.listIssues(filters: IssueFilters(status: "in_review"))
            async let blocked = apiClient.listIssues(filters: IssueFilters(status: "blocked"))
            async let done = apiClient.listIssues(filters: IssueFilters(status: "done", limit: 5))

            let (agentsResponse, reviewResponse, blockedResponse, doneResponse) = try await (agents, review, blocked, done)

            activeRuns = agentsResponse.agents.filter { $0.status == "running" }
            reviewQueue = reviewResponse.issues
            errors = blockedResponse.issues
            recentCompletions = doneResponse.issues.sorted { $0.updatedAt > $1.updatedAt }
        } catch {
            // API errors are surfaced through the empty states
        }
    }
}
