import SwiftUI

struct ReviewQueueSection: View {
    let title: String
    let icon: String
    let issues: [Issue]

    init(title: String = "Needs Review", icon: String = "doc.text.magnifyingglass", issues: [Issue]) {
        self.title = title
        self.icon = icon
        self.issues = issues
    }

    var body: some View {
        Section {
            if issues.isEmpty {
                EmptyRow(icon: icon, text: "Nothing here")
            } else {
                ForEach(issues) { issue in
                    NavigationLink(value: issue.id) {
                        HStack {
                            StatusIcon(status: issue.status)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(issue.title)
                                    .font(.body)
                                    .lineLimit(2)
                                HStack(spacing: 4) {
                                    Text(issue.status.displayName)
                                        .font(.caption)
                                        .foregroundStyle(statusColor(issue.status))
                                    if let priority = issue.priority {
                                        Text(priority.capitalized)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        } header: {
            SectionHeader(title: title, icon: icon, count: issues.count)
        }
    }

    private func statusColor(_ status: IssueStatus) -> Color {
        switch status {
        case .inReview: .blue
        case .blocked: .red
        case .inProgress: .orange
        case .done: .green
        case .todo: .gray
        case .backlog: .gray.opacity(0.5)
        case .cancelled: .gray.opacity(0.5)
        }
    }
}

struct StatusIcon: View {
    let status: IssueStatus

    var body: some View {
        Image(systemName: status.systemImage)
            .foregroundStyle(statusColor(status))
            .font(.callout)
    }

    private func statusColor(_ status: IssueStatus) -> Color {
        switch status {
        case .inReview: .blue
        case .blocked: .red
        case .inProgress: .orange
        case .done: .green
        case .todo: .gray
        case .backlog: .gray.opacity(0.5)
        case .cancelled: .gray.opacity(0.5)
        }
    }
}
