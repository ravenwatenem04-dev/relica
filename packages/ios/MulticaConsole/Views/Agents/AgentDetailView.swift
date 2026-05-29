import SwiftUI

struct AgentDetailView: View {
    let agent: Agent
    let apiClient: APIClient
    @State private var recentIssues: [Issue] = []
    @State private var showIssuePicker = false
    @State private var isLoadingIssues = false
    @State private var issues: [Issue] = []

    var body: some View {
        List {
            Section("Info") {
                LabeledContent("Name", value: agent.displayName)
                LabeledContent("Model", value: agent.model)
                HStack {
                    Text("Status")
                    Spacer()
                    AgentStatusBadge(status: agent.status)
                }
            }

            Section("Capabilities") {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(agent.capabilities, id: \.self) { capability in
                            Text(capability)
                                .font(.caption)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(.quaternary)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            if let task = agent.currentTask {
                Section("Current Task") {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(task.title)
                            .font(.body)
                    }
                }
            }

            Section("Recent Work") {
                if isLoadingIssues {
                    ProgressView()
                } else if recentIssues.isEmpty {
                    Text("No recent work")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(recentIssues, id: \.id) { issue in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(issue.title)
                                .font(.subheadline)
                            HStack {
                                Text(issue.status)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                if let priority = issue.priority {
                                    Text(priority)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }

            Section {
                Button("Assign to Issue") {
                    Task { await loadIssuesForPicker() }
                    showIssuePicker = true
                }
            }
        }
        .navigationTitle(agent.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await fetchRecentIssues()
        }
        .sheet(isPresented: $showIssuePicker) {
            issuePickerSheet
        }
    }

    private func fetchRecentIssues() async {
        isLoadingIssues = true
        do {
            let filters = IssueFilters(
                status: nil,
                priority: nil,
                projectId: nil,
                assigneeId: agent.id,
                search: nil,
                limit: 10,
                offset: nil
            )
            let response = try await apiClient.listIssues(filters: filters)
            recentIssues = response.issues
        } catch {}
        isLoadingIssues = false
    }

    private func loadIssuesForPicker() async {
        do {
            let filters = IssueFilters(
                status: "todo",
                priority: nil,
                projectId: nil,
                assigneeId: nil,
                search: nil,
                limit: 50,
                offset: nil
            )
            let response = try await apiClient.listIssues(filters: filters)
            issues = response.issues
        } catch {}
    }

    private var issuePickerSheet: some View {
        NavigationStack {
            List(issues, id: \.id) { issue in
                Button {
                    Task {
                        do {
                            _ = try await apiClient.assignAgent(issueId: issue.id, agentId: agent.id)
                            showIssuePicker = false
                            await fetchRecentIssues()
                        } catch {}
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(issue.title)
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                        HStack {
                            Text(issue.status)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let priority = issue.priority {
                                Text(priority)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Select Issue")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showIssuePicker = false }
                }
            }
        }
    }
}
