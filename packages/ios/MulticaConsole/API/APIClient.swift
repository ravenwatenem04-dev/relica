import Foundation

enum APIError: Error {
    case unauthorized
    case notFound
    case serverError(statusCode: Int)
    case networkError(Error)
}

final class APIClient {
    private let baseURL: URL
    private let session: URLSession
    private let authManager: AuthManager

    var baseURLDisplayString: String {
        baseURL.absoluteString
    }

    init(authManager: AuthManager, session: URLSession = .shared) {
        let baseURLString = ProcessInfo.processInfo.environment["MULTICA_API_BASE_URL"] ?? "http://localhost:4000"
        self.baseURL = URL(string: baseURLString) ?? URL(string: "http://localhost:4000")!
        self.authManager = authManager
        self.session = session
    }

    func login(token: String) async throws -> User {
        let response: LoginResponse = try await request(path: "/api/auth/login", method: "POST", body: ["token": token], requiresAuth: false)
        await authManager.setToken(response.token)
        return response.user
    }

    func logout() async throws {
        struct EmptyResponse: Codable {}
        _ = try await request(path: "/api/auth/logout", method: "POST", body: Optional<String>.none as String?, requiresAuth: true) as EmptyResponse
        await authManager.clearToken()
    }

    func me() async throws -> User {
        try await request(path: "/api/auth/me", method: "GET", body: Optional<String>.none as String?, requiresAuth: true)
    }

    func listAgents() async throws -> AgentListResponse {
        try await request(path: "/api/agents", method: "GET", body: Optional<String>.none as String?, requiresAuth: true)
    }

    func getAgent(id: String) async throws -> Agent {
        try await request(path: "/api/agents/\(id)", method: "GET", body: Optional<String>.none as String?, requiresAuth: true)
    }

    func listIssues(filters: IssueFilters?) async throws -> IssueListResponse {
        var queryItems: [URLQueryItem] = []
        if let filters {
            if let status = filters.status { queryItems.append(URLQueryItem(name: "status", value: status)) }
            if let priority = filters.priority { queryItems.append(URLQueryItem(name: "priority", value: priority)) }
            if let projectId = filters.projectId { queryItems.append(URLQueryItem(name: "project_id", value: projectId)) }
            if let assigneeId = filters.assigneeId { queryItems.append(URLQueryItem(name: "assignee_id", value: assigneeId)) }
            if let search = filters.search { queryItems.append(URLQueryItem(name: "search", value: search)) }
            if let limit = filters.limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
            if let offset = filters.offset { queryItems.append(URLQueryItem(name: "offset", value: String(offset))) }
        }

        return try await request(path: "/api/issues", method: "GET", queryItems: queryItems, body: Optional<String>.none as String?, requiresAuth: true)
    }

    func getIssue(id: String) async throws -> Issue {
        try await request(path: "/api/issues/\(id)", method: "GET", body: Optional<String>.none as String?, requiresAuth: true)
    }

    func createIssue(request: CreateIssueRequest) async throws -> Issue {
        try await self.request(path: "/api/issues", method: "POST", body: request, requiresAuth: true)
    }

    func updateIssueStatus(id: String, status: String) async throws -> Issue {
        try await request(path: "/api/issues/\(id)/status", method: "POST", body: ["status": status], requiresAuth: true)
    }

    func assignAgent(issueId: String, agentId: String) async throws -> Issue {
        try await request(path: "/api/issues/\(issueId)/assign", method: "POST", body: ["agentId": agentId], requiresAuth: true)
    }

    func listComments(issueId: String) async throws -> [Comment] {
        let response: CommentListResponse = try await request(path: "/api/issues/\(issueId)/comments", method: "GET", body: Optional<String>.none as String?, requiresAuth: true)
        return response.comments
    }

    func addComment(issueId: String, content: String, parentId: String?) async throws -> Comment {
        try await request(path: "/api/issues/\(issueId)/comments", method: "POST", body: AddCommentRequest(content: content, parentId: parentId), requiresAuth: true)
    }

    func usageSummary(period: String) async throws -> UsageSummary {
        try await request(path: "/api/usage/summary", method: "GET", queryItems: [URLQueryItem(name: "period", value: period)], body: Optional<String>.none as String?, requiresAuth: true)
    }

    private func request<T: Decodable, Body: Encodable>(
        path: String,
        method: String,
        queryItems: [URLQueryItem] = [],
        body: Body?,
        requiresAuth: Bool
    ) async throws -> T {
        do {
            var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)
            if !queryItems.isEmpty {
                components?.queryItems = queryItems
            }
            guard let url = components?.url else {
                throw APIError.serverError(statusCode: 500)
            }

            var request = URLRequest(url: url)
            request.httpMethod = method
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            if requiresAuth {
                guard let token = await authManager.token, !token.isEmpty else {
                    throw APIError.unauthorized
                }
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            if let body {
                request.httpBody = try JSONEncoder().encode(body)
            }

            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.serverError(statusCode: 500)
            }

            switch httpResponse.statusCode {
            case 200 ... 299:
                let decoder = JSONDecoder()
                decoder.keyDecodingStrategy = .convertFromSnakeCase
                return try decoder.decode(T.self, from: data)
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            default:
                throw APIError.serverError(statusCode: httpResponse.statusCode)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
}

private struct LoginResponse: Codable {
    let token: String
    let user: User
}

private struct CommentListResponse: Codable {
    let comments: [Comment]
}

private struct AddCommentRequest: Codable {
    let content: String
    let parentId: String?
}
