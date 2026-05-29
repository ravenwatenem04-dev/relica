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

    private let apiClient: APIClient

    init(apiClient: APIClient) {
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
            // API errors surfaced through empty states
        }
    }
}
