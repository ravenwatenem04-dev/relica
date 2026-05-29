import SwiftUI

struct AgentListView: View {
    @State private var viewModel = AgentListViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.agents.isEmpty {
                    ProgressView("Loading agents...")
                } else if let error = viewModel.error, viewModel.agents.isEmpty {
                    ContentUnavailableView(
                        "Failed to Load",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                } else if viewModel.agents.isEmpty {
                    ContentUnavailableView(
                        "No Agents",
                        systemImage: "person.3",
                        description: Text("No agents found in this workspace.")
                    )
                } else {
                    List(viewModel.agents) { agent in
                        NavigationLink(destination: AgentDetailView(agent: agent)) {
                            AgentRow(agent: agent)
                        }
                    }
                    .listStyle(.insetGrouped)
                    .refreshable {
                        await viewModel.loadAgents()
                    }
                }
            }
            .navigationTitle("Agents")
        }
        .task {
            await viewModel.loadAgents()
        }
    }
}
