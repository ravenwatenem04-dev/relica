import Foundation

struct Issue: Identifiable, Codable {
    let id: String
    var title: String
    var description: String?
    var status: IssueStatus
    var priority: String?
    var projectId: String?
    var assigneeId: String?
    var assigneeType: String?
    var metadata: [String: AnyCodable]
    var labels: [String]
    var parentIssueId: String?
    var dueDate: String?
    var createdAt: String
    var updatedAt: String

    var priorityLevel: PriorityLevel {
        PriorityLevel(rawValue: (priority ?? "").lowercased()) ?? .none
    }

    var updatedAtRelative: String {
        updatedAt.relativeTimeFromISO
    }
}

enum IssueStatus: String, Codable, CaseIterable {
    case todo
    case inProgress = "in_progress"
    case inReview = "in_review"
    case done
    case blocked
    case backlog
    case cancelled

    var displayName: String {
        switch self {
        case .todo: return "Todo"
        case .inProgress: return "In Progress"
        case .inReview: return "In Review"
        case .done: return "Done"
        case .blocked: return "Blocked"
        case .backlog: return "Backlog"
        case .cancelled: return "Cancelled"
        }
    }

    var systemImage: String {
        switch self {
        case .todo: return "circle"
        case .inProgress: return "arrow.triangle.2.circlepath"
        case .inReview: return "doc.text.magnifyingglass"
        case .done: return "checkmark.circle.fill"
        case .blocked: return "exclamationmark.triangle.fill"
        case .backlog: return "tray"
        case .cancelled: return "slash.circle"
        }
    }
}

enum PriorityLevel: String {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
    case none = ""

    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        case .none: return "gray"
        }
    }
}

struct IssueListResponse: Codable {
    let issues: [Issue]
    let total: Int
    let hasMore: Bool
}

struct CreateIssueBody: Codable {
    let title: String
    let description: String?
    let priority: String?
    let projectId: String?
}
