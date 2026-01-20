# **Axon (Dive Fork) 기술 문서: 아키텍처 및 API 엔드포인트 상세**

이 문서는 Axon(Dive 포크) 프로젝트의 기술적 구조와 Python 백엔드(mcp-host)가 제공하는 API 엔드포인트를 상세히 설명합니다.

## **1\. 아키텍처 개요 (Architecture Overview)**

Axon은 **"Sidecar" 패턴**을 사용하는 하이브리드 데스크톱 애플리케이션입니다. 사용자 인터페이스(UI)와 메인 로직이 물리적으로 분리된 프로세스에서 실행되며, 로컬 HTTP 통신을 통해 데이터를 주고받습니다.

### **1.1 구조 다이어그램**

graph TD  
    User\[사용자\] \--\> UI\[Electron / React Frontend\]  
      
    subgraph "Electron Process (Main & Renderer)"  
        UI \-- IPC \--\> Main\[Electron Main Process\]  
        UI \-- HTTP Requests \--\> Proxy\[Local Proxy / Client\]  
    end  
      
    subgraph "Sidecar (Python Backend)"  
        Main \-- Spawns/Manages \--\> API\[Python FastAPI Server (mcp-host)\]  
        Proxy \-- localhost:port \--\> API  
        API \--\> Logic\[LLM Agent Logic (LangGraph/LangChain)\]  
        API \--\> DB\[(SQLite Database)\]  
        API \--\> Tools\[Local Tools (File System, Bash, etc.)\]  
    end  
      
    API \-- API Calls \--\> LLMProvider\[External LLM (OpenAI, Anthropic, Ollama)\]

### **1.2 핵심 구성 요소**

1. **Frontend (Electron \+ React/Tauri):**  
   * **역할:** 사용자 인터페이스 제공, 채팅 화면 렌더링, 설정 관리.  
   * **통신:** Python 백엔드로 HTTP 요청을 보내 LLM 응답을 받아옵니다.  
   * **위치:** /src, /electron  
2. **Backend (mcp-host \- Python FastAPI):**  
   * **역할:** 실제 비즈니스 로직 처리, LLM 통신, 로컬 파일 시스템 제어, 데이터베이스 관리.  
   * **실행:** Electron 앱이 시작될 때 자식 프로세스로 실행되며, 사용 가능한 랜덤 포트 또는 지정된 포트에서 HTTP 서버를 엽니다.  
   * **위치:** /mcp-host  
3. **데이터베이스 (SQLite):**  
   * **역할:** 채팅 기록, 설정, 세션 정보 저장.  
   * **위치:** .config/db.sqlite (Alembic을 통해 마이그레이션 관리)

## **2\. Python 백엔드 (mcp-host) 상세 분석**

백엔드는 **FastAPI** 프레임워크를 기반으로 하며, mcp-host/dive\_mcp\_host/httpd/app.py가 진입점입니다. 주요 기능은 라우터(Router)별로 분리되어 있습니다.

### **2.1 주요 API 라우터 (Endpoints)**

아래는 소스 코드(mcp-host/dive\_mcp\_host/httpd/routers/)를 기반으로 분석한 주요 엔드포인트 목록입니다.

#### **A. Chat & LLM (채팅 및 생성) \- routers/chat.py, routers/openai.py**

가장 핵심적인 기능을 담당하며, OpenAI 호환 인터페이스를 일부 지원합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **POST** | /v1/chat/completions | **메인 채팅 생성.** OpenAI API 형식을 따릅니다. 사용자의 메시지를 받아 LLM 에이전트를 실행하고 스트리밍(SSE) 또는 일반 응답을 반환합니다. |
| **POST** | /chat/abort | 생성 중인 답변을 중단합니다. |
| **GET** | /chat/history | 과거 채팅 목록을 페이지네이션하여 가져옵니다. |
| **GET** | /chat/{session\_id} | 특정 채팅 세션의 상세 메시지 기록을 가져옵니다. |
| **DELETE** | /chat/{session\_id} | 특정 채팅 세션을 삭제합니다. |
| **POST** | /chat/{session\_id}/title | 채팅 세션의 제목을 요약/수정합니다. |

#### **B. Models (모델 관리) \- routers/models.py**

사용 가능한 LLM 모델을 조회하고 관리합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | /models | 사용 가능한 모델 목록을 반환합니다. (OpenAI, Ollama, Anthropic 등 설정된 제공자 기반) |
| **POST** | /model/verify | (routers/model\_verify.py) 특정 모델 설정(API Key 등)이 유효한지 검증합니다. |

#### **C. Tools & Plugins (도구 및 플러그인) \- routers/tools.py, routers/plugins.py**

Agent가 사용할 수 있는 도구(파일 읽기/쓰기, 쉘 실행 등)를 관리합니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | /tools | 현재 활성화된 도구(Tools) 목록을 반환합니다. |
| **POST** | /tools/call | (내부용) 특정 도구를 직접 호출하거나 실행 결과를 반환합니다. |
| **GET** | /plugins | 설치된 플러그인 목록을 반환합니다. |
| **POST** | /plugins/install | 새로운 플러그인(MCP 서버 등)을 설치합니다. |

#### **D. Configuration (설정) \- routers/config.py**

애플리케이션 설정을 읽고 씁니다.

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | /config | 현재 백엔드 설정을 가져옵니다. |
| **POST** | /config | 설정을 업데이트합니다. |
| **GET** | /config/args | 실행 인자(Arguments) 정보를 반환합니다. |

#### **E. Utils & System \- routers/utils.py**

| Method | Endpoint | 설명 |
| :---- | :---- | :---- |
| **GET** | /health | 서버 상태 확인 (Health Check). Electron이 서버가 떴는지 확인할 때 사용. |
| **GET** | /system/info | 시스템 정보 반환. |

## **3\. 데이터베이스 스키마 (SQLite)**

mcp-host/dive\_mcp\_host/httpd/database/models.py 및 마이그레이션 파일들을 기반으로 한 주요 테이블 구조입니다.

1. **sessions (또는 chats):** 채팅방 메타데이터 (ID, 제목, 생성일 등).  
2. **messages:** 실제 주고받은 대화 내용. (Role: user/assistant, Content, Timestamp).  
3. **kv\_store:** 설정값이나 세션 상태를 저장하는 Key-Value 저장소.  
4. **oauth\_tokens:** 외부 서비스(구글 등) 연동을 위한 인증 토큰 저장.

## **4\. 실행 흐름 (Execution Flow)**

1. **앱 실행:** 사용자가 Axon.exe(또는 .app)을 실행합니다.  
2. **메인 프로세스 초기화:** Electron Main Process가 시작됩니다.  
3. **사이드카 실행:** Electron은 mcp-host 폴더의 Python 환경을 감지하고, uvicorn 등을 사용하여 백엔드 서버를 자식 프로세스로 스폰(spawn)합니다.  
4. **포트 감지:** Python 서버는 사용 가능한 포트를 찾아 바인딩하고, 이 정보를 stdout 등을 통해 Electron에 알리거나, 미리 약속된 파일/설정을 통해 공유합니다.  
5. **UI 로드:** React 앱이 로드되고, 백엔드 헬스 체크(/health)를 수행합니다.  
6. **상호작용:** 사용자가 채팅을 입력하면 React는 POST /v1/chat/completions로 요청을 보냅니다.  
7. **추론 및 도구 사용:** Python 백엔드의 LangGraph/LangChain 로직이 LLM을 호출하고, 필요시 로컬 파일시스템 도구(service/fs.rs 또는 Python 구현체)를 사용하여 작업을 수행한 뒤 결과를 반환합니다.

## **5\. 개발 참고 사항**

* **Hot Reload:** Electron과 Python 백엔드 모두 개발 모드에서는 Hot Reload를 지원하도록 설정되어 있을 가능성이 높습니다 (dev 스크립트 확인 필요).  
* **환경 변수:** .env 파일이나 process.env를 통해 API Key들이 백엔드로 전달됩니다.  
* **보안:** 로컬 호스트(127.0.0.1)에 바인딩되므로 외부 접근은 차단되지만, 로컬 내의 다른 프로세스 접근에 대한 보안(CSRF 등) 처리가 중요합니다.