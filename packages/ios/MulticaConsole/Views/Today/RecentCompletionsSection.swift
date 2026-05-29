import SwiftUI

struct RecentCompletionsSection: View {
    let issues: [Issue]

    var body: some View {
        Section {
            if issues.isEmpty {
                EmptyRow(icon: "checkmark.circle", text: "Nothing here")
            } else {
                ForEach(issues) { issue in
                    NavigationLink(value: issue) {
                        HStack {
                            StatusIcon(status: issue.status)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(issue.title)
                                    .font(.body)
                                    .lineLimit(2)
                                if let updatedAt = formattedDate(issue.updatedAt) {
                                    Text(updatedAt)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
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

    private func formattedDate(_ iso: String) -> String? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) else { return nil }
        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .abbreviated
        return relative.localizedString(for: date, relativeTo: Date())
    }
}
