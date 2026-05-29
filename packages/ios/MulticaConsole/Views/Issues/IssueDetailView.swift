import SwiftUI

struct IssueDetailView: View {
    let issueId: String
    @State private var viewModel = IssueDetailViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.issue == nil {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if let error = viewModel.error, viewModel.issue == nil {
                ContentUnavailableView(
                    "Failed to Load",
                    systemImage: "exclamationmark.triangle",
                    description: Text(error)
                )
            } else if let issue = viewModel.issue {
                List {
                    headerSection(issue: issue)
                    descriptionSection(issue: issue)
                    statusSection(issue: issue)
                    assignmentSection(issue: issue)
                    commentsSection(issueId: issue.id)
                }
                .listStyle(.insetGrouped)
                .navigationTitle(issue.title)
                .navigationBarTitleDisplayMode(.large)
            }
        }
        .task {
            await viewModel.load(issueId: issueId)
        }
        .sheet(isPresented: $viewModel.isAddCommentPresented) {
            addCommentSheet(issueId: issueId)
        }
        .sheet(isPresented: $viewModel.isAssignAgentPresented) {
            assignAgentSheet(issueId: issueId)
        }
        .sheet(isPresented: $viewModel.isStatusPickerPresented) {
            statusPickerSheet(issueId: issueId)
        }
    }

    @ViewBuilder
    private func headerSection(issue: Issue) -> some View {
        Section {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    StatusPickerLabel(status: issue.status)
                    Spacer()
                    PriorityBadge(priority: issue.priority)
                }

                if let projectId = issue.projectId {
                    Label(projectId, systemImage: "folder")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Label(issue.updatedAtRelative, systemImage: "clock")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    @ViewBuilder
    private func descriptionSection(issue: Issue) -> some View {
        if let description = issue.description, !description.isEmpty {
            Section("Description") {
                Text(try! AttributedString(markdown: description))
                    .font(.body)
            }
        }
    }

    @ViewBuilder
    private func statusSection(issue: Issue) -> some View {
        Section("Status") {
            Button {
                viewModel.isStatusPickerPresented = true
            } label: {
                HStack {
                    Text(issue.status.displayName)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    @ViewBuilder
    private func assignmentSection(issue: Issue) -> some View {
        Section("Assigned To") {
            if let assigneeId = issue.assigneeId {
                HStack {
                    Label(assigneeId, systemImage: "person.fill")
                    Spacer()
                    Button("Unassign") {
                        Task { await viewModel.unassignAgent(issueId: issue.id) }
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }

                if issue.assigneeType == "agent" {
                    Label("Agent", systemImage: "cpu")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                Button("Assign Agent") {
                    Task { await viewModel.loadAgents() }
                    viewModel.isAssignAgentPresented = true
                }
            }
        }
    }

    @ViewBuilder
    private func commentsSection(issueId: String) -> some View {
        Section {
            Button {
                viewModel.isAddCommentPresented = true
            } label: {
                Label("Add Comment", systemImage: "plus.bubble")
            }

            if viewModel.isLoadingComments {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if viewModel.comments.isEmpty {
                Text("No comments yet")
                    .foregroundColor(.secondary)
                    .font(.subheadline)
            } else {
                ForEach(viewModel.comments) { comment in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(comment.authorName)
                                .font(.subheadline.weight(.semibold))
                            Spacer()
                            Text(comment.createdAtRelative)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }

                        Text(try! AttributedString(markdown: comment.content))
                            .font(.body)

                        HStack(spacing: 4) {
                            Image(systemName: comment.authorType == .agent ? "cpu" : "person")
                                .font(.caption2)
                            Text(comment.authorType.displayName)
                                .font(.caption2)
                        }
                        .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        } header: {
            Text("Comments")
        }
    }

    private func addCommentSheet(issueId: String) -> some View {
        NavigationStack {
            Form {
                Section("New Comment") {
                    TextEditor(text: $viewModel.newCommentText)
                        .frame(minHeight: 120)
                }

                if let error = viewModel.commentError {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Add Comment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        viewModel.newCommentText = ""
                        viewModel.isAddCommentPresented = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Submit") {
                        Task { await viewModel.addComment(issueId: issueId) }
                    }
                    .fontWeight(.semibold)
                    .disabled(viewModel.newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func assignAgentSheet(issueId: String) -> some View {
        NavigationStack {
            List {
                if viewModel.agents.isEmpty {
                    ContentUnavailableView(
                        "No Agents",
                        systemImage: "cpu",
                        description: Text("No agents available")
                    )
                } else {
                    ForEach(viewModel.agents) { agent in
                        Button {
                            Task { await viewModel.assignAgent(issueId: issueId, agentId: agent.id) }
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(agent.displayName)
                                        .foregroundColor(.primary)
                                    Text(agent.model)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text(agent.status.displayName)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Assign Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") {
                        viewModel.isAssignAgentPresented = false
                    }
                }
            }
        }
    }

    private func statusPickerSheet(issueId: String) -> some View {
        NavigationStack {
            Form {
                if let issue = viewModel.issue {
                    StatusPicker(selectedStatus: Binding(
                        get: { issue.status },
                        set: { newStatus in
                            Task {
                                await viewModel.changeStatus(issueId: issueId, status: newStatus)
                            }
                        }
                    ))
                }
            }
            .navigationTitle("Change Status")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        viewModel.isStatusPickerPresented = false
                    }
                }
            }
        }
    }
}
