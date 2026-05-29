import Foundation
import Observation

@Observable
final class AgentListViewModel {
    let apiClient: APIClient

    var agents: [Agent] = []
    var isLoading = false
    var error: String?

    var sortedAgents: [Agent] {
        agents.sorted { a, b in
            let order: [String: Int] = ["running": 0, "idle": 1, "offline": 2, "error": 3]
            let aOrder = order[a.status.lowercased()] ?? 4
            let bOrder = order[b.status.lowercased()] ?? 4
            if aOrder != bOrder { return aOrder < bOrder }
            return a.displayName.localizedStandardCompare(b.displayName) == .orderedAscending
        }
    }

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func fetchAgents() async {
        isLoading = true
        error = nil
        do {
            let response = try await apiClient.listAgents()
            agents = response.agents
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
