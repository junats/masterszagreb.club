<task type="auto">
  <name>Capture Vite build output</name>
  <files>frontend/</files>
  <action>
    1. cd frontend
    2. npx vite build --mode production --outDir ../audit/build
       # This builds the app and drops the compiled files into audit/build
    3. cd ..
    4. du -sh audit/build        # Show total size (human‑readable)
    5. grep -i "warning" audit/build/*.js || echo "No warnings"
  </action>
  <verify>
    - File/dir audit/build exists and is not empty.
    - The command prints a size line (e.g. “45M   audit/build”) and, if there are warnings, they appear in the output.
  </verify>
  <done>Build size and any Vite warnings are recorded in audit/build.</done>
</task>
