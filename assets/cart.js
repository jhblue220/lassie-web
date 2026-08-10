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
      items.push({
        id: item.id, name: item.name, price: item.price,
        desc: item.desc || '', color: item.color || '',
        colorCode: item.colorCode || '',      // 컬러칩 표시에 필요
        legName: item.legName || '',          // 플랜 재계산에 필요
        legPrice: item.legPrice || 0,
        planName: item.planName || '',
        image: item.image || '', qty: item.qty || 1,
      });
    }
    write(items);
  }

  // 기존 항목의 일부 값만 갱신 (플랜 선택 시 가격·이름 반영용)
  function update(id, patch) {
    const items = read();
    const target = items.find((i) => i.id === id);
    if (!target) return false;
    Object.assign(target, patch);
    write(items);
    return true;
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


  // ---- 컬러 코드 → 보편적인 컬러 이름 / 칩 스타일 ----
  // 코드는 단일('6B6B6B') 또는 2색('575551-C3BF54')
  const COLOR_LABELS = {
    // Lassie 본체
    E5E4E4: 'Gray', A98F72: 'Beige', BFC392: 'Green', '525F74': 'Indigo', '5C5C5D': 'Black',
    // Accessories
    '6B6B6B': 'Gray', D1CF29: 'Lime', '74A5A9': 'Teal', AEAEAE: 'Gray',
    '575551': 'Charcoal', C3BF54: 'Olive', A9A7AA: 'Gray', '75BFBB': 'Teal',
    '3F3A39': 'Charcoal', FFCAD0: 'Pink', D6D2CD: 'Ivory', D7E145: 'Lime',
    '434342': 'Charcoal', '845240': 'Brown', B0A49B: 'Taupe',
    '363635': 'Black', '897A5E': 'Khaki', '5B534C': 'Taupe', '6F6C55': 'Olive',
    B5B4B5: 'Gray',
  };
  function colorLabel(code) {
    if (!code) return '';
    return String(code).split('-')
      .map((h) => COLOR_LABELS[h.toUpperCase()] || ('#' + h.toUpperCase()))
      .join(' / ');
  }
  function chipStyle(code) {
    const p = String(code || '').split('-');
    if (!p[0]) return '';
    return p.length > 1
      ? 'background:linear-gradient(to bottom, #' + p[0] + ' 0 50%, #' + p[1] + ' 50% 100%)'
      : 'background:#' + p[0];
  }

  document.addEventListener('DOMContentLoaded', updateBadge);

  return { getAll, add, update, setQty, remove, clear, count, subtotal, updateBadge, colorLabel, chipStyle };
})();
