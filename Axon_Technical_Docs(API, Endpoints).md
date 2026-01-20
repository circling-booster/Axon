# **Axon (Dive) 기술 문서 v4: 아키텍처 및 API 명세**

이 문서는 Axon (Dive을 포크함) 프로젝트의 소스 코드를 분석하여 작성된 기술 문서입니다. 실제 구현된 엔드포인트, 데이터베이스 스키마, 그리고 MCP(Model Context Protocol) 호스트로서의 역할을 정확하게 기술합니다.

## **1\. 아키텍처 개요 (Architecture Overview)**

## **2\. API 엔드포인트 상세 (API Endpoints)**

Python 백엔드 서버는 실행 시 동적 포트를 할당받으며, 프론트엔드는 이 포트를 통해 통신합니다.

### **2.1 채팅 API (Chat API)**

Prefix: /api/chat (및 원격용 별칭 /api/v1/mcp)  
채팅 생성, 조회, 수정 및 LLM 스트리밍 응답을 처리합니다.

| Method | Endpoint | 설명 | 파라미터 (Query/Body) |
| :---- | :---- | :---- | :---- |
| **GET** | /list | 채팅방 목록 조회 (starred/normal 구분) | sort\_by (chat 또는 msg) |
| **POST** | / | **채팅 생성 및 메시지 전송** (Stream) | chatId, message, files, filepaths (Multipart) |
| **GET** | /{chat\_id} | 특정 채팅방의 상세 메시지 이력 조회 | \- |
| **PATCH** | /{chat\_id} | 채팅방 메타데이터(제목, 즐겨찾기) 수정 | title, star (JSON) |
| **DELETE** | /{chat\_id} | 채팅방 삭제 | \- |
| **POST** | /edit | 기존 메시지 수정 및 답변 재생성 (Stream) | chatId, messageId, content, files (Multipart) |
| **POST** | /retry | 마지막 답변 재생성 (Stream) | chatId, messageId (JSON) |
| **POST** | /{chat\_id}/abort | 답변 생성 중단 요청 | \- |

#### **주요 요청 상세**

* **채팅 생성 (POST /api/chat)**:  
  * **Type**: multipart/form-data  
  * **Fields**:  
    * chatId: (Text) 채팅방 UUID.  
    * message: (Text) 사용자 입력 텍스트.  
    * files: (Binary List) 업로드할 파일 리스트.  
    * filepaths: (Text List) 로컬 파일 경로 리스트.

### **2.2 설정 API (Config API)**

Prefix: /api/config  
MCP 서버 설정, 모델 설정, 커스텀 규칙 등을 관리합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | /mcpserver | 현재 설정된 MCP 서버 목록 및 상태 반환 |
| **POST** | /mcpserver | MCP 서버 설정 저장 및 호스트 리로드 (force 옵션 가능) |
| **GET** | /model | 현재 활성화된 LLM 모델 전체 설정 반환 |
| **POST** | /model | 특정 제공자(Provider)의 모델 설정 저장 |
| **GET** | /model/interface | 모델 설정을 위한 UI 스키마(ModelInterfaceDefinition) 반환 |
| **POST** | /model-embedding | 임베딩 모델 설정 저장 |
| **POST** | /model/replaceAll | 모델 설정을 전체 교체 |
| **GET** | /customrules | 시스템 프롬프트/커스텀 룰 조회 |
| **POST** | /customrules | 시스템 프롬프트/커스텀 룰 저장 |

### **2.3 도구 및 인증 API (Tools & Auth)**

Prefix: /api/tools  
MCP 도구의 목록을 조회하거나 OAuth 인증을 처리합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | / | 사용 가능한 모든 MCP 도구 목록(McpTool) 반환 |
| **GET** | /initialized | 초기화 상태 확인 |
| **POST** | /logs/stream | MCP 서버의 로그를 실시간 스트리밍 (SSE) |
| **POST** | /login/oauth | 도구 사용을 위한 OAuth 인증 시작 |
| **GET** | /login/oauth/callback | OAuth 콜백 처리 (HTML 반환) |
| **POST** | /login/oauth/delete | 저장된 OAuth 토큰 삭제 및 해당 서버 재시작 (로그아웃) |
| **POST** | /elicitation/respond | MCP 서버의 사용자 개입 요청(Elicitation)에 대한 응답 전송 |

### **2.4 모델 검증 API (Model Verify)**

**Prefix:** /model\_verify (주의: /api 하위가 아님)

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **POST** | / | 모델 연결, 도구 호출 가능 여부 등을 단일 검증 |
| **POST** | /streaming | 검증 과정을 실시간 스트리밍으로 반환 |

### **2.5 OpenAI 호환 API**

Prefix: /v1/openai  
외부 앱이 Axon을 OpenAI 호환 서버처럼 사용할 수 있게 합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | / | API 작동 확인용 웰컴 메시지 반환 |
| **GET** | /models | 사용 가능한 모델 목록 반환 |
| **POST** | /chat/completions | OpenAI 포맷의 채팅 요청 처리 |

## **3\. 데이터베이스 스키마 (Database Schema)**

백엔드는 SQLAlchemy를 사용하며 SQLite(기본) 또는 PostgreSQL을 지원합니다. (소스 코드 orm\_models.py 기준)

### **3.1 Users 테이블 (users)**

사용자 정보를 저장합니다. chats 테이블과 1:N 관계를 가집니다.

| 컬럼명 | 타입 | Nullable | 설명 |
| :---- | :---- | :---- | :---- |
| **id** | Text (PK) | No | 사용자 ID 또는 식별자 |
| user\_type | CHAR(10) | Yes | 사용자 유형 |

### **3.2 Chats 테이블 (chats)**

채팅 세션의 메타데이터를 저장합니다.

| 컬럼명 | 타입 | Nullable | 설명 |
| :---- | :---- | :---- | :---- |
| **id** | Text (PK) | No | UUID 문자열 |
| title | Text | No | 채팅방 제목 |
| created\_at | DateTime | No | 생성 일시 |
| updated\_at | DateTime | Yes | 수정 일시 |
| starred\_at | DateTime | Yes | 즐겨찾기 등록 일시 (NULL이면 일반) |
| user\_id | Text (FK) | Yes | users.id 참조 (CASCADE Delete) |

### **3.3 Messages 테이블 (messages)**

실제 대화 내용을 저장합니다.

| 컬럼명 | 타입 | Nullable | 설명 |
| :---- | :---- | :---- | :---- |
| **id** | Integer (PK) | No | 자동 증가 ID (BigInteger) |
| **message\_id** | Text (Unique) | No | 메시지 고유 UUID |
| chat\_id | Text (FK) | No | 소속 채팅방 ID (chats.id 참조) |
| role | Text | No | user, assistant, system |
| content | Text | No | 메시지 본문 |
| files | Text | No | 첨부 파일 정보 (문자열 형태) |
| tool\_calls | JSON | Yes | 도구 호출 정보 (함수명, 인자 등) |
| created\_at | DateTime | No | 생성 일시 |

### **3.4 OAuth Credentials 테이블 (oauth\_credentials)**

MCP 서버 연결에 필요한 인증 정보를 저장합니다.

| 컬럼명 | 타입 | Nullable | 설명 |
| :---- | :---- | :---- | :---- |
| **id** | Integer (PK) | No | 기본 키 |
| user\_id | Text (FK) | No | 사용자 ID |
| name | Text | No | MCP 서버 이름 (user\_id와 복합 Unique) |
| access\_token | Text | Yes | 액세스 토큰 |
| refresh\_token | Text | Yes | 리프레시 토큰 |
| expire | DateTime | Yes | 만료 시간 (DateTime 형식) |
| scope | Text | Yes | 권한 범위 |
| client\_id | Text | Yes | 클라이언트 ID |
| client\_secret | Text | Yes | 클라이언트 시크릿 |
| client\_info | JSON | Yes | 추가 클라이언트 정보 |
| oauth\_metadata | JSON | Yes | OAuth 메타데이터 |
| token\_expiry\_time | BigInteger | Yes | 만료 시간 (Unix Timestamp 형식) |

### **3.5 Resource Usage 테이블 (resource\_usage)**

메시지별 상세 토큰 사용량 및 성능 메트릭을 추적합니다.

| 컬럼명 | 타입 | 설명 |
| :---- | :---- | :---- |
| **id** | Integer (PK) | 기본 키 |
| message\_id | Text (FK) | 메시지 ID |
| model | Text | 사용된 모델 이름 |
| total\_input\_tokens | BigInteger | 총 입력 토큰 수 |
| total\_output\_tokens | BigInteger | 총 출력 토큰 수 |
| user\_token | BigInteger | 사용자 입력 토큰 수 |
| custom\_prompt\_token | BigInteger | 커스텀 프롬프트 토큰 수 |
| system\_prompt\_token | BigInteger | 시스템 프롬프트 토큰 수 |
| time\_to\_first\_token | Float | 첫 토큰 생성까지 걸린 시간 (초) |
| tokens\_per\_second | Float | 초당 생성 토큰 수 (TPS) |
| total\_run\_time | Float | 전체 실행 시간 |

## **4\. MCP (Model Context Protocol) 구현 상세**

Axon은 **MCP Host** 역할을 수행합니다. 사용자가 설정한 MCP Server 설정(mcp\_config.json)을 기반으로 다음 프로세스를 수행합니다.

1. **연결**: Stdio 또는 SSE 방식을 통해 로컬/원격 MCP 서버와 연결합니다.  
2. **검색 (Discovery)**: 연결된 서버로부터 ListTools, ListResources, ListPrompts를 호출하여 사용 가능한 기능을 파악합니다.  
3. **실행 (Execution)**: 사용자의 질문이 특정 도구를 필요로 한다고 LLM이 판단하면, Axon(Host)이 해당 MCP 서버에 CallTool 요청을 보냅니다.  
4. **권한 관리**: 민감한 도구 실행 전 사용자에게 확인 팝업(PopupConfirm.tsx)을 띄워 승인을 받습니다.

### **내장 플러그인 (Built-in Plugins)**

Axon은 외부 MCP 서버 외에도 자체적인 기능을 플러그인 형태로 제공합니다.

* **mcp\_installer\_plugin**: 새로운 MCP 서버를 설치하거나 설정하는 도구  
  * 제공 도구: bash, fetch (HTTP 요청), file\_ops (파일 조작), mcp\_server (설정 관리)  
* **oap\_plugin**: OpenAI API 호환 서버 관리 플