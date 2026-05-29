import SwiftUI

struct IssueRow: View {
    let issue: Issue

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: issue.status.systemImage)
                .foregroundColor(statusColor)
                .font(.title3)

            VStack(alignment: .leading, spacing: 4) {
                Text(issue.title)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(2)

                HStack(spacing: 8) {
                    if let assigneeId = issue.assigneeId {
                        HStack(spacing: 2) {
                            Image(systemName: "person.fill")
                                .font(.caption2)
                            Text(assigneeId.prefix(8))
                                .font(.caption2)
                        }
                        .foregroundColor(.secondary)
                    }

                    Text(issue.updatedAtRelative)
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Spacer()

                    PriorityBadge(priority: issue.priority)
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var statusColor: Color {
        switch issue.status {
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
