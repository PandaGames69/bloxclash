export function openSupport() {
  window.$crisp.push(["do", "chat:show"])
  window.$crisp.push(["do", "chat:open"])
}