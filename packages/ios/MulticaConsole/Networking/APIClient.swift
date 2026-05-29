import Foundation

actor APIClient {
    static let shared = APIClient()

    private var baseURL: String = "http://localhost:3001"
    private var token: String?
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .never
        self.session = URLSession(configuration: config)
    }

    func configure(baseURL: String, token: String) {
        self.baseURL = baseURL
        self.token = token
    }

    func setToken(_ token: String) {
        self.token = token
    }

    func getToken() -> String? { token }

    func isLoggedIn() -> Bool { token != nil }

    func clearToken() { token = nil }

    var baseURLString: String { baseURL }

    // MARK: - Auth

    func login(token: String) async throws {
        self.token = token
        _ = try await get("/api/auth/me") as User
    }

    func logout() async {
        clearToken()
    }

    // MARK: - Issues

    func listIssues(
        status: String? = nil,
        priority: String? = nil,
        projectId: String? = nil,
        assigneeId: String? = nil,
        search: String? = nil,
        limit: Int = 50,
        offset: Int = 0
    ) async throws -> IssueListResponse {
        var query: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "offset", value: String(offset)),
        ]
        if let status { query.append(URLQueryItem(name: "status", value: status)) }
        if let priority { query.append(URLQueryItem(name: "priority", value: priority)) }
        if let projectId { query.append(URLQueryItem(name: "project_id", value: projectId)) }
        if let assigneeId { query.append(URLQueryItem(name: "assignee_id", value: assigneeId)) }
        if let search { query.append(URLQueryItem(name: "search", value: search)) }

        return try await get("/api/issues", query: query)
    }

    func listIssues(filters: (status: String?, limit: Int?)) async throws -> IssueListResponse {
        var query: [URLQueryItem] = []
        if let status = filters.status { query.append(URLQueryItem(name: "status", value: status)) }
        if let limit = filters.limit { query.append(URLQueryItem(name: "limit", value: String(limit))) }
        return try await get("/api/issues", query: query)
    }

    func getIssue(id: String) async throws -> Issue {
        try await get("/api/issues/\(id)")
    }

    func createIssue(body: CreateIssueBody) async throws -> Issue {
        try await post("/api/issues", body: body)
    }

    func changeIssueStatus(id: String, status: IssueStatus) async throws -> Issue {
        try await post("/api/issues/\(id)/status", body: ["status": status.rawValue])
    }

    func assignIssue(id: String, agentId: String) async throws -> Issue {
        try await post("/api/issues/\(id)/assign", body: ["agentId": agentId])
    }

    func unassignIssue(id: String) async throws -> Issue {
        try await post("/api/issues/\(id)/unassign")
    }

    func fetchIssues(limit: Int = 50, offset: Int = 0) async throws -> [Issue] {
        let response: IssueListResponse = try await listIssues(limit: limit, offset: offset)
        return response.issues
    }

    // MARK: - Comments

    func listComments(issueId: String) async throws -> CommentListResponse {
        try await get("/api/issues/\(issueId)/comments")
    }

    func addComment(issueId: String, content: String, parentId: String? = nil) async throws -> Comment {
        let body: [String: String?] = ["content": content, "parentId": parentId]
        return try await post("/api/issues/\(issueId)/comments", body: body.compactMapValues { $0 })
    }

    // MARK: - Agents

    func listAgents(limit: Int = 50, offset: Int = 0) async throws -> AgentListResponse {
        let query = [
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "offset", value: String(offset)),
        ]
        return try await get("/api/agents", query: query)
    }

    func fetchAgents() async throws -> [Agent] {
        let response: AgentListResponse = try await listAgents()
        return response.agents
    }

    func fetchAgent(id: String) async throws -> Agent {
        try await get("/api/agents/\(id)")
    }

    func fetchAgentRuns(agentId: String, limit: Int = 10) async throws -> [Run] {
        let response: RunListResponse = try await get("/api/agents/\(agentId)/runs?limit=\(limit)")
        return response.runs
    }

    // MARK: - Usage

    func usageSummary(period: String = "30d") async throws -> UsageSummary {
        try await get("/api/usage/summary?period=\(period)")
    }

    // MARK: - User

    func me() async throws -> User {
        try await get("/api/auth/me")
    }

    // MARK: - HTTP

    private func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        var components = URLComponents(string: "\(baseURL)\(path)")!
        if !query.isEmpty {
            components.queryItems = query
        }
        var request = URLRequest(url: components.url!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let data = try await perform(request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func post<T: Decodable>(_ path: String, body: some Encodable) async throws -> T {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(body)
        let data = try await perform(request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func post<T: Decodable>(_ path: String) async throws -> T {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let data = try await perform(request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
        return data
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code, let message):
            return "HTTP \(code): \(message)"
        }
    }
}
