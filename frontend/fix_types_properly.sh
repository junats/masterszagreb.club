#!/bin/bash

# Backup
cp ../common/types/index.ts ../common/types/index.ts.backup2

# Show the line numbers of the interfaces we need to fix
echo "=== Current Achievement interface ==="
grep -n -A15 "interface Achievement" ../common/types/index.ts

echo "=== Current CustodyDay interface ==="
grep -n -A10 "interface CustodyDay" ../common/types/index.ts
