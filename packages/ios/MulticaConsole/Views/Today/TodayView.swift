import SwiftUI

struct TodayView: View {
    @State private var viewModel = TodayViewModel()

    var body: some View {
        NavigationStack {
            List {
                ActiveRunsSection(agents: viewModel.activeRuns)
                ReviewQueueSection(
                    title: "Needs Review",
                    icon: "doc.text.magnifyingglass",
                    issues: viewModel.reviewQueue
                )
                ReviewQueueSection(
                    title: "Errors",
                    icon: "exclamationmark.triangle",
                    issues: viewModel.errors
                )
                RecentCompletionsSection(issues: viewModel.recentCompletions)
            }
            .navigationTitle("Today")
            .refreshable {
                await viewModel.fetchData()
            }
            .task {
                await viewModel.fetchData()
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .navigationDestination(for: String.self) { issueId in
                IssueDetailView(issueId: issueId)
            }
            .navigationDestination(for: Agent.self) { agent in
                AgentDetailView(agent: agent)
            }
        }
    }
}
