import SwiftUI

struct RecentCompletionsSection: View {
    let issues: [Issue]

    var body: some View {
        Section {
            if issues.isEmpty {
                EmptyRow(icon: "checkmark.circle", text: "Nothing here")
            } else {
                ForEach(issues) { issue in
                    NavigationLink(value: issue.id) {
                        HStack {
                            StatusIcon(status: issue.status)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(issue.title)
                                    .font(.body)
                                    .lineLimit(2)
                                Text(issue.updatedAtRelative)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        } header: {
            SectionHeader(title: "Recent Completions", icon: "checkmark.circle", count: issues.count)
        }
    }
}
