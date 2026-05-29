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
                                        .foregroundStyle(StatusColor(status: issue.status))
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
}

struct StatusIcon: View {
    let status: String

    var body: some View {
        Image(systemName: iconName)
            .foregroundStyle(StatusColor(status: status))
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
}

struct StatusColor {
    let color: Color

    init(status: String) {
        switch status {
        case "in_review": color = .blue
        case "blocked": color = .red
        case "in_progress": color = .orange
        case "done": color = .green
        case "todo": color = .gray
        default: color = .secondary
        }
    }

    func callAsFunction() -> Color { color }
}

extension StatusColor: View {
    var body: Color { color }
}
