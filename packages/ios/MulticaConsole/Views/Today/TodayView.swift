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
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ConnectionIndicator(state: viewModel.streamState)
                }
            }
            .refreshable {
                await viewModel.fetchData()
            }
            .task {
                await viewModel.fetchData()
                viewModel.startLiveUpdatesIfNeeded()
            }
            .onDisappear {
                viewModel.stopLiveUpdates()
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .navigationDestination(for: Issue.self) { issue in
                IssueDetailStub(issue: issue)
            }
            .navigationDestination(for: Agent.self) { agent in
                AgentDetailStub(agent: agent)
            }
        }
    }
}

private struct ConnectionIndicator: View {
    let state: EventStreamConnectionState

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 10, height: 10)
            .accessibilityLabel(label)
    }

    private var color: Color {
        switch state {
        case .connected:
            return .green
        case .connecting:
            return .yellow
        case .disconnected:
            return .red
        }
    }

    private var label: String {
        switch state {
        case .connected:
            return "Connected"
        case .connecting:
            return "Connecting"
        case .disconnected:
            return "Disconnected"
        }
    }
}

private struct IssueDetailStub: View {
    let issue: Issue

    var body: some View {
        List {
            Text(issue.title)
                .font(.title)
            if let description = issue.description {
                Text(description)
                    .foregroundStyle(.secondary)
            }
            LabeledContent("Status", value: issue.status.replacingOccurrences(of: "_", with: " ").capitalized)
            if let priority = issue.priority {
                LabeledContent("Priority", value: priority.capitalized)
            }
        }
        .navigationTitle("Issue Detail")
    }
}

private struct AgentDetailStub: View {
    let agent: Agent

    var body: some View {
        List {
            Text(agent.displayName)
                .font(.title)
            LabeledContent("Status") {
                AgentStatusBadge(status: agent.status)
            }
            LabeledContent("Model", value: agent.model)
            if let task = agent.currentTask {
                LabeledContent("Current Task", value: task.title)
            }
            if !agent.capabilities.isEmpty {
                Section("Capabilities") {
                    ForEach(agent.capabilities, id: \.self) { capability in
                        Text(capability)
                    }
                }
            }
        }
        .navigationTitle("Agent Detail")
    }
}
