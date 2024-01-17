export function changePathVisibility(path: string, hide: boolean) {
	const escapedPath = CSS.escape(path);
	const n = document.querySelector(`[data-path="${escapedPath}"]`);
	if (!n) {
		return;
	}
	const p = n.parentElement
    if (!p) return;
	if (hide) {
		p.style.display = `none`
	} else {
		p.style.display = ``;
	}
}