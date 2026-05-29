import SwiftUI

struct CreateIssueView: View {
    @Environment(\.dismiss) private var dismiss
    let onCreated: () -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var priority = "medium"
    @State private var projectId = ""
    @State private var isSubmitting = false
    @State private var error: String?

    private let priorities = ["low", "medium", "high", "critical"]
    private let projects = ["default"]

    var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Title") {
                    TextField("Issue title", text: $title)
                        .disabled(isSubmitting)
                }

                Section("Description") {
                    TextEditor(text: $description)
                        .frame(minHeight: 120)
                        .disabled(isSubmitting)
                }

                Section("Priority") {
                    Picker("Priority", selection: $priority) {
                        ForEach(priorities, id: \.self) { p in
                            Text(p.capitalized).tag(p)
                        }
                    }
                    .disabled(isSubmitting)
                }

                Section("Project") {
                    Picker("Project", selection: $projectId) {
                        ForEach(projects, id: \.self) { p in
                            Text(p).tag(p)
                        }
                    }
                    .disabled(isSubmitting)
                }

                if let error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("New Issue")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isSubmitting)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Create") {
                        Task { await submit() }
                    }
                    .fontWeight(.semibold)
                    .disabled(!isValid || isSubmitting)
                }
            }
        }
    }

    private func submit() async {
        guard isValid else { return }
        isSubmitting = true
        error = nil

        let body = CreateIssueBody(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : description,
            priority: priority,
            projectId: projectId.isEmpty ? nil : projectId
        )

        do {
            _ = try await APIClient.shared.createIssue(body: body)
            onCreated()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }

        isSubmitting = false
    }
}
