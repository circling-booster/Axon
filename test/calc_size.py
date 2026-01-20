import os
import fnmatch
from collections import defaultdict


def format_size(size_bytes):
    """바이트 단위를 사람이 읽기 쉬운 단위로 변환"""
    if size_bytes == 0: return "0 B"
    units = ("B", "KB", "MB", "GB", "TB")
    i = 0
    s = float(size_bytes)
    while s >= 1024 and i < len(units) - 1:
        s /= 1024
        i += 1
    return f"{s:.2f} {units[i]}"


def load_claudeignore_patterns(root_path):
    """
    .claudeignore 파일을 읽어서 패턴 리스트 반환
    """
    claudeignore_path = os.path.join(root_path, '.claudeignore')
    
    if not os.path.exists(claudeignore_path):
        print("⚠️  .claudeignore 파일이 없습니다!")
        return []
    
    patterns = []
    with open(claudeignore_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # 빈 줄이나 주석 제외
            if line and not line.startswith('#'):
                patterns.append(line)
    
    return patterns


def match_pattern(path, pattern):
    """
    단일 패턴과 경로 매칭 (gitignore 스타일)
    """
    # 부정 패턴
    if pattern.startswith('!'):
        return False
    
    # 디렉토리 패턴 (끝에 / 있음)
    is_dir_pattern = pattern.endswith('/')
    if is_dir_pattern:
        pattern = pattern.rstrip('/')
        # 디렉토리 패턴은 해당 디렉토리 내 모든 파일 매칭
        if path.startswith(pattern + '/'):
            return True
        parts = path.split('/')
        for i in range(len(parts)):
            if fnmatch.fnmatch(parts[i], pattern):
                return True
    
    # ** 패턴 처리
    if '**' in pattern:
        # **/pattern 형태
        if pattern.startswith('**/'):
            sub_pattern = pattern[3:]
            # 모든 깊이에서 매칭
            parts = path.split('/')
            for i in range(len(parts)):
                remaining = '/'.join(parts[i:])
                if fnmatch.fnmatch(remaining, sub_pattern) or fnmatch.fnmatch(remaining, sub_pattern + '/*'):
                    return True
                if '/' in sub_pattern:
                    # 디렉토리 포함 패턴
                    if remaining.startswith(sub_pattern.rstrip('/') + '/') or remaining == sub_pattern.rstrip('/'):
                        return True
            return False
        
        # pattern/** 형태
        elif pattern.endswith('/**'):
            prefix = pattern[:-3]
            return path.startswith(prefix + '/') or path == prefix
    
    # 확장자 패턴 (*.ext)
    if pattern.startswith('*.'):
        return path.endswith(pattern[1:]) or ('/' + pattern in '/' + path)
    
    # 일반 패턴
    # 1. 전체 경로 매칭
    if fnmatch.fnmatch(path, pattern):
        return True
    
    # 2. 경로가 패턴으로 시작
    if path.startswith(pattern + '/'):
        return True
    
    # 3. 파일명만 매칭
    filename = path.split('/')[-1]
    if fnmatch.fnmatch(filename, pattern):
        return True
    
    # 4. 디렉토리명 매칭
    parts = path.split('/')
    for part in parts:
        if fnmatch.fnmatch(part, pattern):
            return True
    
    return False


def is_ignored(posix_path, patterns):
    """
    주어진 경로가 patterns에 의해 무시되는지 확인
    """
    for pattern in patterns:
        if match_pattern(posix_path, pattern):
            return True
    return False


def get_all_files(root_path):
    """파일 탐색 및 경로 수집"""
    file_list = []
    print("📂 파일 스캔 중...", end="", flush=True)
    count = 0
    
    for root, dirs, files in os.walk(root_path):
        # .git 폴더 제외
        if '.git' in dirs: 
            dirs.remove('.git')
            
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, root_path)
            # POSIX 스타일 경로로 변환
            posix_path = rel_path.replace(os.sep, '/')
            file_list.append((rel_path, posix_path))
            count += 1
            
    print(f" 완료 ({count:,}개 파일)")
    return file_list


def identify_ignored_files(file_pairs, patterns):
    """
    패턴 리스트를 이용해 무시되는 파일 식별
    """
    if not patterns:
        return set()
    
    print("🔍 .claudeignore 규칙 대조 중...", end="", flush=True)
    
    ignored_paths = set()
    
    for rel_path, posix_path in file_pairs:
        if is_ignored(posix_path, patterns):
            ignored_paths.add(posix_path)
    
    print(f" 완료 ({len(ignored_paths):,}개 무시됨)")
    return ignored_paths


def analyze_extensions(target_files, root_path):
    """확장자별 통계 계산"""
    ext_stats = defaultdict(lambda: {'count': 0, 'size': 0})
    
    for rel_path in target_files:
        full_path = os.path.join(root_path, rel_path)
        try:
            size = os.path.getsize(full_path)
            _, ext = os.path.splitext(rel_path)
            ext = ext.lower() if ext else "(no ext)"
            
            ext_stats[ext]['count'] += 1
            ext_stats[ext]['size'] += size
        except OSError: 
            pass
        
    return ext_stats


def main():
    root_path = os.getcwd()
    print(f"Target Project: {root_path}")
    print("-" * 60)

    # .claudeignore 로드
    patterns = load_claudeignore_patterns(root_path)
    if not patterns:
        print("⚠️  .claudeignore 파일이 비어있거나 로드할 수 없습니다.")
        return

    print(f"📋 로드된 패턴: {len(patterns)}개\n")

    # 1. 데이터 수집
    all_files_pairs = get_all_files(root_path)
    ignored_set = identify_ignored_files(all_files_pairs, patterns)

    # 2. 통계 집계 변수
    folder_stats = {}
    target_files_list = []
    top_files = []

    total_target_size = 0
    total_ignored_size = 0
    total_target_count = 0
    total_ignored_count = 0

    print("📊 데이터 분석 및 정렬 중...", end="", flush=True)

    for rel_path, posix_path in all_files_pairs:
        full_path = os.path.join(root_path, rel_path)
        try:
            size = os.path.getsize(full_path)
        except OSError: 
            continue

        # 최상위 폴더 기준 집계
        top_level = rel_path.split(os.sep)[0]
        is_dir = os.path.isdir(os.path.join(root_path, top_level))
        
        if top_level not in folder_stats:
            folder_stats[top_level] = {
                "t_size": 0, "i_size": 0, 
                "t_count": 0, "i_count": 0, 
                "is_dir": is_dir
            }

        if posix_path in ignored_set:
            # Ignored
            folder_stats[top_level]["i_size"] += size
            folder_stats[top_level]["i_count"] += 1
            total_ignored_size += size
            total_ignored_count += 1
        else:
            # Target
            folder_stats[top_level]["t_size"] += size
            folder_stats[top_level]["t_count"] += 1
            total_target_size += size
            total_target_count += 1
            
            target_files_list.append(rel_path)
            top_files.append((rel_path, size))

    print(" 완료\n")

    # 3. 리포트 출력 1: 폴더별 현황
    print("1️⃣  [폴더별 상세 현황] (이름순)")
    print("=" * 105)
    h_fmt = "{:<25} | {:>10} | {:>10} | {:>12} | {:>12} | {:>12}"
    print(h_fmt.format("Directory/File", "✅ T.Count", "⛔ I.Count", "✅ T.Size", "⛔ I.Size", "Total Size"))
    print("-" * 105)

    sorted_keys = sorted(folder_stats.keys())
    for name in sorted_keys:
        st = folder_stats[name]
        d_name = name + "/" if st["is_dir"] else name
        total_s = st["t_size"] + st["i_size"]
        
        print(h_fmt.format(
            d_name[:25], 
            f"{st['t_count']:,}", 
            f"{st['i_count']:,}", 
            format_size(st['t_size']), 
            format_size(st['i_size']), 
            format_size(total_s)
        ))

    print("=" * 105)
    print(h_fmt.format(
        "TOTAL", 
        f"{total_target_count:,}", 
        f"{total_ignored_count:,}", 
        format_size(total_target_size), 
        format_size(total_ignored_size), 
        format_size(total_target_size + total_ignored_size)
    ))
    print("\n")

    # 4. 리포트 출력 2: 확장자별 점유율
    print("2️⃣  [확장자별 분석] (Target 파일 기준, 용량순 정렬)")
    print("=" * 70)
    print(f"{'Extension':<15} | {'Count':>10} | {'Size':>15} | {'Share (%)':>10}")
    print("-" * 70)

    ext_data = analyze_extensions(target_files_list, root_path)
    sorted_ext = sorted(ext_data.items(), key=lambda x: x[1]['size'], reverse=True)

    for ext, data in sorted_ext:
        if total_target_size > 0:
            share = (data['size'] / total_target_size) * 100
        else:
            share = 0
        print(f"{ext:<15} | {data['count']:>10,} | {format_size(data['size']):>15} | {share:>9.1f}%")
    print("-" * 70)
    print("\n")

    # 5. 리포트 출력 3: 가장 큰 파일 TOP 10
    print("3️⃣  [가장 큰 파일 TOP 10] (Target 파일 기준)")
    print("=" * 100)
    print(f"{'Rank':<5} | {'Size':>12} | {'File Path'}")
    print("-" * 100)
    
    top_files.sort(key=lambda x: x[1], reverse=True)
    for idx, (path, size) in enumerate(top_files[:10], 1):
        print(f"#{idx:<4} | {format_size(size):>12} | {path}")
    print("=" * 100)
    
    # 6. 추가: 특정 파일 검증
    print("\n")
    print("4️⃣  [특정 파일 검증 예시]")
    print("=" * 80)
    test_files = [
        "mcp-host/.venv/Lib/site-packages/numpy.libs/test.dll",
        "mcp-host/.venv/Scripts/python.exe",
        "src-tauri/icons/icon.icns",
        "package-lock.json",
        "Cargo.lock",
        "docs/example.gif",
        "src/main.tsx",
        "build/icon.png",
        "node_modules/package/index.js",
        "dist/bundle.js",
        "release/app.exe"
    ]
    
    for test_path in test_files:
        ignored = is_ignored(test_path, patterns)
        status = "⛔ IGNORED" if ignored else "✅ TRACKED"
        print(f"{status} | {test_path}")
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌오류 발생: {e}")
        import traceback
        traceback.print_exc()
