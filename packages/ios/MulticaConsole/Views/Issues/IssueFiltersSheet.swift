import SwiftUI

struct IssueFiltersSheet: View {
    @Bindable var viewModel: IssueListViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Status") {
                    ForEach(IssueStatus.allCases, id: \.self) { status in
                        Button {
                            if viewModel.filterStatus.contains(status) {
                                viewModel.filterStatus.remove(status)
                            } else {
                                viewModel.filterStatus.insert(status)
                            }
                        } label: {
                            HStack {
                                Image(systemName: status.systemImage)
                                    .foregroundColor(statusColor(status))
                                Text(status.displayName)
                                    .foregroundColor(.primary)
                                Spacer()
                                if viewModel.filterStatus.contains(status) {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                    }
                }

                Section("Priority") {
                    ForEach(["low", "medium", "high", "critical"], id: \.self) { priority in
                        Button {
                            if viewModel.filterPriority == priority {
                                viewModel.filterPriority = nil
                            } else {
                                viewModel.filterPriority = priority
                            }
                        } label: {
                            HStack {
                                PriorityBadge(priority: priority)
                                Spacer()
                                if viewModel.filterPriority == priority {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Clear") {
                        viewModel.clearFilters()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func statusColor(_ status: IssueStatus) -> Color {
        switch status {
        case .todo: return .gray
        case .inProgress: return .blue
        case .inReview: return .purple
        case .done: return .green
        case .blocked: return .red
        case .backlog: return .gray.opacity(0.5)
        case .cancelled: return .gray.opacity(0.5)
        }
    }
}
