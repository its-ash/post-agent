.PHONY: run build deploy

run:
	npm run dev

build:
	npm run generate

deploy: build
	@echo "Copy generated output to docs/ for GitHub Pages"
	cp -r .output/public docs 2>/dev/null || true
	touch docs/.nojekyll
	git checkout main
	git add -A
	@git commit -m "$$(copilot -sp 'Analyze the staged git changes and generate a concise commit message. Output ONLY the commit message. Do not execute any commands. Do not include quotes, markdown, explanation, or bullet points.')"
	git push origin main