/* 사이트 전체에서 공유하는 간단한 장바구니 저장소 (localStorage 기반) */
const Cart = (() => {
  const KEY = 'lassie_cart_v1';

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  }

  function getAll() {
    return read();
  }

  function add(item) {
    const items = read();
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      items.push({ id: item.id, name: item.name, price: item.price, desc: item.desc || '', color: item.color || '', image: item.image || '', qty: item.qty || 1 });
    }
    write(items);
  }

  function setQty(id, qty) {
    const items = read();
    const target = items.find((i) => i.id === id);
    if (!target) return;
    target.qty = Math.max(1, qty);
    write(items);
  }

  function remove(id) {
    write(read().filter((i) => i.id !== id));
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, i) => sum + i.qty, 0);
  }

  function subtotal() {
    return read().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function updateBadge() {
    const n = count();
    document.querySelectorAll('.cart-badge').forEach((el) => {
      el.textContent = String(n);
      el.style.display = n > 0 ? 'flex' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', updateBadge);

  return { getAll, add, setQty, remove, clear, count, subtotal, updateBadge };
})();
