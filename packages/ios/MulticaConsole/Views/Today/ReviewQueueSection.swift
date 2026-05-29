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
                    NavigationLink(value: issue) {
                        HStack {
                            StatusIcon(status: issue.status)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(issue.title)
                                    .font(.body)
                                    .lineLimit(2)
                                HStack(spacing: 4) {
                                    Text(issue.status.replacingOccurrences(of: "_", with: " ").capitalized)
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

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "in_review": .blue
        case "blocked": .red
        case "in_progress": .orange
        case "done": .green
        case "todo": .gray
        default: .secondary
        }
    }
}

struct StatusIcon: View {
    let status: String

    var body: some View {
        Image(systemName: iconName)
            .foregroundStyle(iconColor)
            .font(.callout)
    }

    private var iconName: String {
        switch status {
        case "in_review": "doc.text.magnifyingglass"
        case "blocked": "exclamationmark.octagon"
        case "in_progress": "arrow.triangle.2.circlepath"
        case "done": "checkmark.circle"
        case "todo": "circle"
        default: "questionmark.circle"
        }
    }

    private var iconColor: Color {
        switch status {
        case "in_review": .blue
        case "blocked": .red
        case "in_progress": .orange
        case "done": .green
        case "todo": .gray
        default: .secondary
        }
    }
}
