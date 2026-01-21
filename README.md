# **Axon**

**An Extensible AI IDE & MCP Client**

*Forked from [Dive](https://github.com/openagentplatform/dive), Enhanced for Axon*

## **Introduction**

**Axon**은 Tauri, React, Python으로 구축된 강력한 데스크톱 AI 애플리케이션입니다. \*\*Model Context Protocol (MCP)\*\*를 통해 LLM(Large Language Models)을 로컬 환경과 지능적으로 통합하여, 단순한 채팅을 넘어선 진정한 **AI IDE** 경험을 제공합니다.

이 프로젝트는 [Dive](https://github.com/openagentplatform/dive)를 기반으로 포크되었으며, Axon만의 커스텀 API 엔드포인트, 강화된 컨텍스트 인식 기능, 그리고 크롬 확장 프로그램과의 연동성을 추가하여 더욱 강력한 도구로 진화했습니다.

## **✨ Key Features (통합 기능)**

Axon은 기존 Dive의 강력한 기능에 Axon만의 독자적인 기능을 더했습니다.

### **🚀 Core Features (from Dive)**

* **MCP(Model Context Protocol) 지원:** 표준화된 프로토콜을 통해 로컬 파일 시스템, 데이터베이스, 도구 등을 LLM과 원활하게 연결합니다.  
* **다중 LLM 지원:**  
  * **Local:** Ollama 등을 통한 로컬 모델 구동 지원.  
  * **Cloud:** OpenAI, Anthropic, Google Gemini 등 주요 클라우드 모델 API 통합.  
* **지능형 코드베이스 인덱싱:** 프로젝트 전체를 이해하고 관련 컨텍스트를 검색하여 답변합니다.  
* **강력한 런타임:** Python 기반의 mcp-host를 통해 안정적이고 확장 가능한 서버 환경을 제공합니다.

### **⚡ Axon Exclusive Features**

* **Chrome Extension Integration:** 브라우저에서 보고 있는 웹 페이지, 기술 문서, 드래그한 텍스트를 즉시 Axon으로 전송하여 분석할 수 있습니다.  
* **Custom API Endpoints:** Axon 클라이언트와 통신하기 위한 최적화된 내부 API 및 딥링크 지원.  
* **Enhanced Context Management:** 웹 컨텍스트와 로컬 코드 컨텍스트를 결합한 하이브리드 지식 처리.

## **📚 Documentation**

Axon의 상세 문서는 다음 경로에서 확인할 수 있습니다.

* [**API & Endpoints Reference**](/docs/API_REFERENCE.md): Axon의 내부 API 구조, IPC 통신, 엔드포인트 명세. (구 Axon\_Technical\_Docs...)  
* [**Chrome Extension Guide**](/chrome-extension/README.md): 브라우저 확장 프로그램 설치 및 연동 가이드.  
* [**MCP Setup Guide**](MCP_SETUP.md): MCP 서버 설정 및 연결 방법.
* [**Dive README**](README_Dive.md): Dive 의 README 파일.


## **📂 Project Structure**

* **src-tauri/**: Rust 백엔드. 시스템 트레이, 파일 시스템 접근, 프로세스 관리 담당.  
* **src/**: React 프론트엔드. UI/UX 및 사용자 인터랙션 담당.  
* **mcp-host/**: Python 기반 MCP 서버 호스트. LLM 및 툴 실행 로직 포함.  
* **chrome-extension/**: 웹 컨텍스트 수집을 위한 브라우저 확장 프로그램 소스.  
* **docs/**: 프로젝트 기술 문서 모음.

## **License**

This project is licensed under the MIT License, following the original Dive project's licensing terms.