import SwiftUI

struct AgentDetailView: View {
    let agent: Agent
    @State private var runs: [Run] = []
    @State private var issues: [Issue] = []
    @State private var isLoadingRuns = false
    @State private var showIssuePicker = false
    @State private var isAssigning = false

    var body: some View {
        List {
            Section("Info") {
                LabeledContent("Name", value: agent.displayName)
                LabeledContent("Status") {
                    AgentStatusBadge(status: agent.status)
                }
                LabeledContent("Model", value: agent.model)
            }

            Section("Capabilities") {
                if agent.capabilities.isEmpty {
                    Text("None")
                        .foregroundStyle(.tertiary)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(agent.capabilities, id: \.self) { capability in
                                Text(capability)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(
                                        Capsule()
                                            .fill(Color.accentColor.opacity(0.12))
                                    )
                                    .foregroundStyle(.accent)
                            }
                        }
                    }
                }
            }

            Section("Current Task") {
                if let task = agent.currentTask {
                    NavigationLink(value: task.id) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(task.title)
                                .font(.body)
                            Text("Issue")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } else {
                    Text("No current task")
                        .foregroundStyle(.tertiary)
                }
            }

            Section("Recent Work") {
                if isLoadingRuns {
                    ProgressView()
                } else if runs.isEmpty {
                    Text("No recent runs")
                        .foregroundStyle(.tertiary)
                } else {
                    ForEach(runs) { run in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(run.agentName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Spacer()
                                runStatusBadge(run.status)
                            }
                            if let model = run.model {
                                Text(model)
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                            if let startedAt = run.startedAt {
                                Text("Started: \(formattedDate(startedAt))")
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }

            Section {
                Button("Assign to Issue") {
                    Task { await loadIssues() }
                    showIssuePicker = true
                }
                .disabled(isAssigning)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(agent.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadRuns()
        }
        .sheet(isPresented: $showIssuePicker) {
            issuePickerView
        }
    }

    private var issuePickerView: some View {
        NavigationStack {
            List(issues) { issue in
                Button {
                    Task {
                        await assignToIssue(issueId: issue.id)
                        showIssuePicker = false
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(issue.title)
                            .font(.body)
                            .foregroundStyle(.primary)
                        Text("Status: \(issue.status.displayName)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Select Issue")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showIssuePicker = false }
                }
            }
            .overlay {
                if isAssigning {
                    ProgressView("Assigning...")
                }
            }
        }
    }

    private func loadRuns() async {
        isLoadingRuns = true
        do {
            runs = try await APIClient.shared.fetchAgentRuns(agentId: agent.id, limit: 10)
        } catch {
            // surface through empty state
        }
        isLoadingRuns = false
    }

    private func loadIssues() async {
        do {
            issues = try await APIClient.shared.fetchIssues()
        } catch {
            // surface through empty state
        }
    }

    private func assignToIssue(issueId: String) async {
        isAssigning = true
        do {
            _ = try await APIClient.shared.assignIssue(id: issueId, agentId: agent.id)
            await loadRuns()
        } catch {
            // surface through error state
        }
        isAssigning = false
    }

    private func runStatusBadge(_ status: String) -> some View {
        let color: Color = switch status {
        case "running": .blue
        case "succeeded": .green
        case "failed": .red
        case "cancelled": .orange
        default: .gray
        }
        return Text(status.capitalized)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                Capsule()
                    .fill(color.opacity(0.12))
            )
    }

    private func formattedDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) else {
            return iso
        }
        let display = DateFormatter()
        display.dateStyle = .medium
        display.timeStyle = .short
        return display.string(from: date)
    }
}
