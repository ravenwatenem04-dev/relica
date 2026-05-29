import SwiftUI

struct AgentListView: View {
    @State private var viewModel: AgentListViewModel

    init(apiClient: APIClient) {
        _viewModel = State(initialValue: AgentListViewModel(apiClient: apiClient))
    }

    var body: some View {
        List(viewModel.sortedAgents, id: \.id) { agent in
            NavigationLink(destination: AgentDetailView(agent: agent, apiClient: viewModel.apiClient)) {
                AgentRow(agent: agent)
            }
        }
        .navigationTitle("Agents")
        .refreshable {
            await viewModel.fetchAgents()
        }
        .overlay {
            if viewModel.isLoading && viewModel.agents.isEmpty {
                ProgressView()
            } else if let error = viewModel.error {
                ContentUnavailableView(
                    "Couldn't Load Agents",
                    systemImage: "exclamationmark.triangle",
                    description: Text(error)
                )
            } else if viewModel.agents.isEmpty {
                ContentUnavailableView(
                    "No Agents",
                    systemImage: "person.2",
                    description: Text("No agents found.")
                )
            }
        }
        .task {
            await viewModel.fetchAgents()
        }
    }
}
