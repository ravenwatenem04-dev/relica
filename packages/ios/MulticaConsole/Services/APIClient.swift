import Foundation

enum APIClientError: LocalizedError {
    case invalidURL
    case httpError(statusCode: Int, message: String)
    case decodingError(Error)
    case unauthorized
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .httpError(let statusCode, let message):
            return "HTTP \(statusCode): \(message)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized"
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}

actor APIClient {
    static let shared = APIClient()

    var baseURL: String = "http://localhost:3001"
    var sessionCookie: String?

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        self.session = URLSession(configuration: config)
    }

    func login(token: String) async throws {
        let body = ["token": token]
        let data = try await request(path: "/api/auth/login", method: "POST", body: body)
        if let httpResponse = session.configuration.httpCookieStorage?.cookies?.first(where: { $0.name == "multica_session" }) {
            sessionCookie = httpResponse.value
        }
    }

    func fetchAgents() async throws -> [Agent] {
        let data = try await request(path: "/api/agents")
        let response = try JSONDecoder().decode(AgentListResponse.self, from: data)
        return response.agents
    }

    func fetchAgent(id: String) async throws -> Agent {
        let data = try await request(path: "/api/agents/\(id)")
        return try JSONDecoder().decode(Agent.self, from: data)
    }

    func fetchAgentRuns(agentId: String, limit: Int = 10) async throws -> [Run] {
        let data = try await request(path: "/api/agents/\(agentId)/runs?limit=\(limit)")
        let response = try JSONDecoder().decode(RunListResponse.self, from: data)
        return response.runs
    }

    func fetchIssues(limit: Int = 50, offset: Int = 0) async throws -> [Issue] {
        let data = try await request(path: "/api/issues?limit=\(limit)&offset=\(offset)")
        let response = try JSONDecoder().decode(IssueListResponse.self, from: data)
        return response.issues
    }

    func fetchUsageSummary(period: UsagePeriod) async throws -> UsageSummary {
        let data = try await request(path: "/api/usage/summary?period=\(period.rawValue)")
        return try JSONDecoder().decode(UsageSummary.self, from: data)
    }

    func assignIssue(issueId: String, agentId: String) async throws {
        let body = AssignRequest(agentId: agentId)
        let _ = try await request(path: "/api/issues/\(issueId)/assign", method: "POST", body: body)
    }

    @discardableResult
    private func request(path: String, method: String = "GET", body: some Codable) async throws -> Data {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let cookie = sessionCookie {
            urlRequest.setValue("multica_session=\(cookie)", forHTTPHeaderField: "Cookie")
        }

        if method != "GET", let body = body as? any Encodable {
            urlRequest.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await session.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.unknown(NSError(domain: "", code: -1))
        }

        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIClientError.unauthorized
        default:
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIClientError.httpError(statusCode: httpResponse.statusCode, message: message)
        }
    }

    @discardableResult
    private func request(path: String, method: String = "GET") async throws -> Data {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let cookie = sessionCookie {
            urlRequest.setValue("multica_session=\(cookie)", forHTTPHeaderField: "Cookie")
        }

        let (data, response) = try await session.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.unknown(NSError(domain: "", code: -1))
        }

        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIClientError.unauthorized
        default:
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIClientError.httpError(statusCode: httpResponse.statusCode, message: message)
        }
    }
}

struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ wrapped: some Encodable) {
        _encode = { encoder in
            let container = encoder.singleValueContainer()
            try container.encode(AnyEncodableValue(wrapped))
        }
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

struct AnyEncodableValue: Encodable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let int = value as? Int {
            try container.encode(int)
        } else if let string = value as? String {
            try container.encode(string)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if let dict = value as? [String: Any] {
            var dictContainer = encoder.container(keyedBy: AnyCodingKey.self)
            for (key, val) in dict {
                if let key = AnyCodingKey(stringValue: key) {
                    try dictContainer.encode(AnyEncodableValue(val), forKey: key)
                }
            }
        } else if let array = value as? [Any] {
            var arrayContainer = container.nestedUnkeyedContainer()
            for item in array {
                try arrayContainer.encode(AnyEncodableValue(item))
            }
        } else if value is NSNull {
            try container.encodeNil()
        } else {
            try container.encode(String(describing: value))
        }
    }
}

struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init?(stringValue: String) { self.stringValue = stringValue; self.intValue = nil }
    init?(intValue: Int) { self.stringValue = "\(intValue)"; self.intValue = intValue }
}
