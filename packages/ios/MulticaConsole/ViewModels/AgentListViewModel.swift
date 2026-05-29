import Foundation
import Observation

@Observable
@MainActor
final class AgentListViewModel {
    private(set) var agents: [Agent] = []
    private(set) var isLoading = false
    private(set) var error: String?
    private(set) var selectedAgent: Agent?
    private(set) var selectedAgentRuns: [Run] = []
    private(set) var availableIssues: [Issue] = []
    private(set) var isAssigning = false

    func loadAgents() async {
        isLoading = true
        error = nil

        do {
            let fetched = try await APIClient.shared.fetchAgents()
            agents = fetched.sorted { lhs, rhs in
                let order: [AgentStatus: Int] = [.running: 0, .available: 1, .disabled: 2, .blocked: 3]
                let lOrder = order[lhs.status] ?? 99
                let rOrder = order[rhs.status] ?? 99
                if lOrder != rOrder { return lOrder < rOrder }
                return lhs.displayName.localizedStandardCompare(rhs.displayName) == .orderedAscending
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func selectAgent(_ agent: Agent) async {
        selectedAgent = agent
        selectedAgentRuns = []

        do {
            selectedAgentRuns = try await APIClient.shared.fetchAgentRuns(agentId: agent.id, limit: 10)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadIssues() async {
        do {
            availableIssues = try await APIClient.shared.fetchIssues()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func assignAgentToIssue(issueId: String) async {
        guard let agent = selectedAgent else { return }
        isAssigning = true

        do {
            _ = try await APIClient.shared.assignIssue(id: issueId, agentId: agent.id)
            await selectAgent(agent)
            await loadAgents()
        } catch {
            self.error = error.localizedDescription
        }

        isAssigning = false
    }
}
