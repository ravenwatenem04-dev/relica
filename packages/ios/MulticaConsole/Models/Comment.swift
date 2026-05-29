import Foundation

struct Comment: Identifiable, Codable {
    let id: String
    let issueId: String
    let parentId: String?
    let authorType: AuthorType
    let authorId: String
    let authorName: String
    let content: String
    let attachments: [Attachment]
    let createdAt: String
    let updatedAt: String

    var createdAtRelative: String {
        createdAt.relativeTimeFromISO
    }

    enum AuthorType: String, Codable {
        case member
        case agent
        case system

        var displayName: String {
            switch self {
            case .member: return "Member"
            case .agent: return "Agent"
            case .system: return "System"
            }
        }
    }
}

struct Attachment: Codable {
    let id: String
    let filename: String
    let size: Int
    let mimeType: String
}

struct CommentListResponse: Codable {
    let comments: [Comment]
    let total: Int
}

struct CreateCommentBody: Codable {
    let content: String
    let parentId: String?
}
