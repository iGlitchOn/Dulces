/* app.js - lógica separada y mejoras */

/* ---------- Utilidades ---------- */
const STORAGE_KEY = 'inventario_dulces_v2';
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 700;

function parseNumber(val, fallback = 0) {
    if (val === null || val === undefined || val === '') return fallback;
    const n = Number(String(val).toString().replace(/,/g, ''));
    return isNaN(n) ? fallback : n;
}

function formatCurrency(val) {
    // redondeamos a entero (pesos), y mostramos separadores de miles
    const rounded = Math.round(parseNumber(val,0));
    return '$' + new Intl.NumberFormat('es-ES').format(rounded);
}

function formatInteger(val) {
    return new Intl.NumberFormat('es-ES').format(Math.round(parseNumber(val,0)));
}

function showAutoSave() {
    const el = document.getElementById('autoSaveIndicator');
    el.classList.add('show');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(()=> el.classList.remove('show'), 1200);
}

function saveDataToLocalStorageDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(()=> {
        try {
            const data = { proveedores, productos: getTableData(), margenGlobal: document.getElementById('margenGlobal').value, lastSaved: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            showAutoSave();
        } catch (e) {
            console.warn('No se pudo guardar localmente:', e);
        }
    }, SAVE_DEBOUNCE_MS);
}

/* ---------- Datos ---------- */
let proveedores = ["DICOHA","M. DULCES"];
let productos = [];

/* Productos iniciales (valores originales) */
const productosIniciales = [
    { proveedor: "DICOHA", producto: "TIC TAC PASTILLITAS ADVENTURE", link: "", unidades: 12, precioPaquete: 24600, precioVenta: 0, stock: 1 },
    { proveedor: "DICOHA", producto: "CHICLE INDIVIDUAL HIPERACIDO", link: "", unidades: 50, precioPaquete: 11500, precioVenta: 0, stock: 0 },
    { proveedor: "M. DULCES", producto: "CHICLE ACIDOMETRO", link: "", unidades: 50, precioPaquete: 11700, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "BARRA BON BON BUM", link: "", unidades: 24, precioPaquete: 8800, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "ATOMOS REVOLCON", link: "", unidades: 50, precioPaquete: 9000, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "BRIDGE INDIVIDUAL VAINILLA", link: "", unidades: 30, precioPaquete: 6100, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "CHICLE AGOGO ÁTOMOS SURTIDO", link: "", unidades: 50, precioPaquete: 8000, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "CANDYRANCH MORA", link: "", unidades: 24, precioPaquete: 8200, precioVenta: 0, stock: 0 },
    { proveedor: "M. DULCES", producto: "CIGARROS DE MENTA", link: "", unidades: 20, precioPaquete: 6200, precioVenta: 0, stock: 0 },
    { proveedor: "DICOHA", producto: "SPLOT ESPANTA OJOS", link: "", unidades: 24, precioPaquete: 4500, precioVenta: 0, stock: 0 },
    { proveedor: "M. DULCES", producto: "CHICLE SPLOT BOMBA ACIDO LINEA", link: "", unidades: 50, precioPaquete: 8500, precioVenta: 0, stock: 0 }
];

/* ---------- Carga / Guardado ---------- */
function loadDataFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data.proveedores && data.productos) {
            proveedores = data.proveedores;
            productos = data.productos;
            updateProviderSelect();
            loadTableData();
            if (data.margenGlobal) document.getElementById('margenGlobal').value = data.margenGlobal;
            return true;
        }
    } catch(e) { console.warn('error loading',e); }
    return false;
}

/* ---------- UI helpers ---------- */
function markButtonActive(el, persist = false) {
    if (!el) return;
    el.classList.add('btn-pressed');
    if (!persist) {
        setTimeout(()=> el.classList.remove('btn-pressed'), 600);
    }
}

/* ---------- Proveedores ---------- */
function updateProviderSelect() {
    const sel = document.getElementById('filterProveedor');
    sel.innerHTML = '<option value="">Todos los proveedores</option>';
    proveedores.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
    });
    updateNewProductProviderSelect();
}

function updateProviderList() {
    const list = document.getElementById('providerList');
    list.innerHTML = '';
    proveedores.forEach(p => {
        const item = document.createElement('div');
        item.className = 'provider-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '8px';
        item.style.marginBottom = '8px';
        item.style.border = '1px solid #e6e9ee';
        item.style.borderRadius = '8px';
        item.innerHTML = `<div>${escapeHtml(p)}</div><div><button class="delete-btn" data-prov="${escapeHtml(p)}">Eliminar</button></div>`;
        list.appendChild(item);
    });
    // event delegation for deletes
    list.querySelectorAll('.delete-btn').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
            const name = e.currentTarget.getAttribute('data-prov');
            removeProvider(name);
        });
    });
}

function addProvider() {
    const nameEl = document.getElementById('newProviderName');
    const name = nameEl.value.trim();
    if (!name) { alert('Ingresa un nombre válido'); return; }
    if (proveedores.includes(name)) { alert('Proveedor ya existe'); return; }
    proveedores.push(name);
    updateProviderSelect();
    updateProviderList();
    nameEl.value = '';
    saveDataToLocalStorageDebounced();
}

function removeProvider(name) {
    if (!confirm(`¿Eliminar proveedor "${name}"?`)) return;
    proveedores = proveedores.filter(p => p !== name);
    updateProviderSelect();
    updateProviderList();
    // update rows that referenced the provider - keep provider text but mark missing visually
    document.querySelectorAll('#tableBody tr').forEach(tr => {
        const pn = tr.querySelector('.proveedor-name');
        if (pn && pn.textContent === name) {
            pn.textContent = proveedores[0] || '';
            pn.classList.add('provider-missing');
        }
    });
    saveDataToLocalStorageDebounced();
}

/* ---------- Modal / add product ---------- */
function showProviderModal() {
    document.getElementById('providerModal').setAttribute('aria-hidden', 'false');
    updateProviderList();
}
function closeProviderModal() { document.getElementById('providerModal').setAttribute('aria-hidden', 'true'); }

function showAddProductModal() {
    document.getElementById('addProductModal').setAttribute('aria-hidden', 'false');
    updateNewProductProviderSelect();
    setTimeout(()=>document.getElementById('newProductName').focus(),120);
}
function closeAddProductModal() {
    document.getElementById('addProductModal').setAttribute('aria-hidden', 'true');
    ['newProductName','newProductLink','newProductUnits','newProductPrice','newProductStock'].forEach(id=>{
        const el=document.getElementById(id); if (el) el.value = (id==='newProductUnits'?1:0);
    });
}

function updateNewProductProviderSelect() {
    const sel = document.getElementById('newProductProvider');
    if (!sel) return;
    sel.innerHTML = '';
    proveedores.forEach(p=>{
        const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o);
    });
}

/* ---------- Table helpers ---------- */
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function getTableData() {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    return rows.map(row => {
        const proveedor = row.querySelector('.proveedor-name')?.textContent || '';
        const producto = (row.querySelector('.producto-input')?.value || row.querySelector('.producto-text')?.textContent || '').trim();
        const link = row.querySelector('.link-input')?.value || '';
        const unidades = parseNumber(row.querySelector('.unidades-input')?.value, 0);
        const precioPaquete = parseNumber(row.querySelector('.precio-paquete-input')?.value, 0);
        const precioVenta = parseNumber(row.querySelector('.precio-venta-input')?.value, 0);
        const stock = parseNumber(row.querySelector('.stock-paquetes-input')?.value, 0);
        return { proveedor, producto, link, unidades, precioPaquete, precioVenta, stock };
    }).filter(p=>p.producto);
}

function loadTableData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    const list = (productos && productos.length) ? productos : productosIniciales;
    list.forEach(p=> addRowWithData(p,false));
    calculateAll();
    adjustProductColumnWidth();
}

function addRowWithData(data, isNew = false) {
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.draggable = true;
    row.addEventListener('dragstart', dragStart);
    row.addEventListener('dragend', dragEnd);

    row.innerHTML = `
        <td class="drag-col"><div class="drag-handle" title="Arrastrar" tabindex="0">☰</div></td>
        <td><div class="proveedor-name">${escapeHtml(data.proveedor || '')}</div></td>
        <td>
            <div class="producto-text" ondblclick="(function(){})()" title="${escapeHtml(data.producto || 'Nombre del producto')}">${escapeHtml(data.producto || 'Nombre del producto')}</div>
            <input class="producto-input" type="text" value="${escapeHtml(data.producto || '')}" placeholder="Nombre del producto" style="display:none;">
        </td>
        <td style="width:90px;"><input class="unidades-input" type="number" min="1" value="${parseNumber(data.unidades,1)}"></td>
        <td style="width:120px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="money-prefix">$</span>
                <input class="precio-paquete-input" type="number" step="1" min="0" value="${parseNumber(data.precioPaquete,0)}">
            </div>
        </td>
        <td class="costo-unitario" style="width:110px;">$0</td>
        <td style="width:130px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="money-prefix">$</span>
                <input class="precio-venta-input" type="number" step="1" min="0" value="${parseNumber(data.precioVenta,0)}">
            </div>
        </td>
        <td class="ganancia-unitaria" style="width:110px;">$0</td>
        <td class="margen" style="width:90px;">0.0%</td>
        <td style="width:120px;"><input class="stock-paquetes-input" type="number" min="0" value="${parseNumber(data.stock,0)}"></td>
        <td class="inversion" style="width:110px;">$0</td>
        <td class="ganancia-total" style="width:120px;">$0</td>
        <td>
            <div class="actions-cell">
                <button class="link-button" aria-label="Abrir enlace">🔗</button>
                <input class="link-input" type="url" value="${escapeHtml(data.link || '')}" placeholder="https://..." style="display:none; width:240px;">
                <button class="delete-btn" aria-label="Eliminar producto">🗑️</button>
            </div>
        </td>
    `;

    // Event listeners
    const inputs = row.querySelectorAll('input');
    inputs.forEach(el=>{
        el.addEventListener('change', (e)=>{
            if (el.classList.contains('unidades-input') || el.classList.contains('precio-paquete-input') || el.classList.contains('precio-venta-input') || el.classList.contains('stock-paquetes-input')) {
                calculateRow(el);
            }
            if (el.classList.contains('link-input')) updateLinkButton(el);
            saveDataToLocalStorageDebounced();
        });
        // enter-key handler for inline inputs (name/link)
        el.addEventListener('keypress', (ev)=> {
            if (ev.key === 'Enter') {
                ev.target.blur();
            }
        });
    });

    // product name inline edit (dblclick)
    const textEl = row.querySelector('.producto-text');
    const nameInput = row.querySelector('.producto-input');
    textEl.addEventListener('dblclick', ()=>{
        textEl.style.display = 'none';
        nameInput.style.display = 'block';
        nameInput.focus();
        nameInput.select();
    });
    nameInput.addEventListener('blur', ()=>{
        const newText = nameInput.value.trim() || 'Nombre del producto';
        textEl.textContent = newText;
        textEl.title = newText;
        textEl.style.display = 'inline-block';
        nameInput.style.display = 'none';
        saveDataToLocalStorageDebounced();
        adjustProductColumnWidth();
    });

    // actions: link, delete
    const linkInput = row.querySelector('.link-input');
    const linkBtn = row.querySelector('.link-button');
    const deleteBtn = row.querySelector('.delete-btn');

    linkBtn.addEventListener('click', ()=>{
        const link = (linkInput.value || '').trim();
        if (!link) {
            linkInput.style.display = 'block';
            linkInput.focus();
            linkInput.addEventListener('blur', function() {
                linkInput.style.display = 'none';
                updateLinkButton(linkInput);
                saveDataToLocalStorageDebounced();
            }, { once: true });
            return;
        }
        const url = link.startsWith('http://') || link.startsWith('https://') ? link : 'https://'+link;
        window.open(url, '_blank');
    });

    deleteBtn.addEventListener('click', ()=>{
        if (!confirm('¿Eliminar producto?')) return;
        row.remove();
        calculateAll();
        saveDataToLocalStorageDebounced();
    });

    // enable/disable link button initial state
    linkBtn.disabled = !(linkInput.value && linkInput.value.trim());

    // drag handle visual feedback
    const handle = row.querySelector('.drag-handle');
    if (handle) {
        handle.addEventListener('pointerdown', ()=> handle.classList.add('btn-pressed'));
        handle.addEventListener('pointerup', ()=> setTimeout(()=> handle.classList.remove('btn-pressed'), 140));
    }

    tbody.appendChild(row);
    // calculate initial values for this row
    calculateRow(row.querySelector('.precio-paquete-input') || row.querySelector('.unidades-input'));
}

/* ---------- Cálculos ---------- */
function calculateRow(inputEl) {
    const row = inputEl.closest('tr');
    const unidades = parseNumber(row.querySelector('.unidades-input')?.value, 0);
    const precioPaquete = parseNumber(row.querySelector('.precio-paquete-input')?.value, 0);
    const precioVenta = parseNumber(row.querySelector('.precio-venta-input')?.value, 0);
    const stockPaquetes = parseNumber(row.querySelector('.stock-paquetes-input')?.value, 0);

    const costoUnitario = unidades > 0 ? precioPaquete / unidades : 0;
    const gananciaUnitaria = precioVenta - costoUnitario;
    const margen = costoUnitario > 0 ? (gananciaUnitaria / costoUnitario) * 100 : 0;
    const inversion = stockPaquetes * precioPaquete;
    const gananciaTotal = Math.round((stockPaquetes * unidades) * gananciaUnitaria);

    row.querySelector('.costo-unitario').textContent = formatCurrency(costoUnitario);
    const gu = row.querySelector('.ganancia-unitaria');
    gu.textContent = formatCurrency(gananciaUnitaria);
    gu.className = 'ganancia-unitaria ' + (gananciaUnitaria >= 0 ? 'profit-positive' : 'profit-negative');

    const mg = row.querySelector('.margen');
    mg.textContent = `${margen.toFixed(1)}%`;
    mg.className = 'margen ' + (margen >= 0 ? 'profit-positive' : 'profit-negative');

    row.querySelector('.inversion').textContent = formatCurrency(inversion);
    const gt = row.querySelector('.ganancia-total');
    gt.textContent = formatCurrency(gananciaTotal);
    gt.className = 'ganancia-total ' + (gananciaTotal >= 0 ? 'profit-positive' : 'profit-negative');

    if (stockPaquetes === 0) {
        row.classList.add('stock-out'); row.classList.remove('stock-low');
    } else if (stockPaquetes <= 2) {
        row.classList.add('stock-low'); row.classList.remove('stock-out');
    } else {
        row.classList.remove('stock-low','stock-out');
    }

    updateSummary();
    // not saving here directly, debounced saving handled by caller
}

function calculateAll() {
    document.querySelectorAll('#tableBody tr').forEach(tr=>{
        const anyInput = tr.querySelector('.precio-paquete-input') || tr.querySelector('.unidades-input') || tr.querySelector('.precio-venta-input');
        if (anyInput) calculateRow(anyInput);
    });
}

/* ---------- Summary ---------- */
function updateSummary() {
    let totalInv = 0, totalGan = 0, prodStock = 0, sumMarg = 0, cntMarg = 0;
    document.querySelectorAll('#tableBody tr').forEach(tr=>{
        const inv = parseNumber((tr.querySelector('.inversion')?.textContent || '$0').replace(/\$/g,'').replace(/,/g,''),0);
        const gan = parseNumber((tr.querySelector('.ganancia-total')?.textContent || '$0').replace(/\$/g,'').replace(/,/g,''),0);
        const stock = parseNumber(tr.querySelector('.stock-paquetes-input')?.value,0);
        const margen = parseNumber((tr.querySelector('.margen')?.textContent || '0').replace('%',''),0);
        totalInv += Math.round(inv);
        totalGan += Math.round(gan);
        if (stock > 0) { prodStock++; sumMarg += margen; cntMarg++; }
    });
    const margProm = cntMarg? (sumMarg / cntMarg): 0;
    const invEl = document.getElementById('totalInversion');
    const tgEl = document.getElementById('totalGanancia');
    invEl.textContent = formatCurrency(totalInv);
    tgEl.textContent = formatCurrency(totalGan);
    tgEl.className = 'value ' + (totalGan >= 0 ? 'profit-positive' : 'profit-negative');
    document.getElementById('margenPromedio').textContent = `${margProm.toFixed(1)}%`;
    document.getElementById('productosStock').textContent = prodStock;
}

/* ---------- Sorting ---------- */
let currentSortDirection = 'desc';
function toggleSort() {
    currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
    document.getElementById('btnSortToggle').textContent = currentSortDirection === 'desc' ? '↓' : '↑';
    const column = document.getElementById('sortCategory').value || 'inversion';
    sortTable(column, currentSortDirection);
}

function sortTable(column, forceDirection = null) {
    const tbody = document.getElementById('tableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const dir = forceDirection || currentSortDirection;
    const collator = new Intl.Collator('es', { numeric:true, sensitivity:'base' });

    rows.sort((a,b) => {
        let av, bv;
        switch(column) {
            case 'proveedor': av = a.querySelector('.proveedor-name').textContent; bv = b.querySelector('.proveedor-name').textContent; break;
            case 'producto': av = a.querySelector('.producto-text').textContent; bv = b.querySelector('.producto-text').textContent; break;
            case 'unidades': av = parseNumber(a.querySelector('.unidades-input').value)||0; bv = parseNumber(b.querySelector('.unidades-input').value)||0; break;
            case 'precioPaquete': av = parseNumber(a.querySelector('.precio-paquete-input').value)||0; bv = parseNumber(b.querySelector('.precio-paquete-input').value)||0; break;
            case 'precioVenta': av = parseNumber(a.querySelector('.precio-venta-input').value)||0; bv = parseNumber(b.querySelector('.precio-venta-input').value)||0; break;
            case 'margen': av = parseNumber((a.querySelector('.margen')?.textContent || '0').replace('%',''))||0; bv = parseNumber((b.querySelector('.margen')?.textContent || '0').replace('%',''))||0; break;
            case 'stock': av = parseNumber(a.querySelector('.stock-paquetes-input').value)||0; bv = parseNumber(b.querySelector('.stock-paquetes-input').value)||0; break;
            case 'inversion': av = parseNumber((a.querySelector('.inversion')?.textContent||'$0').replace(/\$/g,'').replace(/,/g,''))||0; bv = parseNumber((b.querySelector('.inversion')?.textContent||'$0').replace(/\$/g,'').replace(/,/g,''))||0; break;
            case 'gananciaTotal': av = parseNumber((a.querySelector('.ganancia-total')?.textContent||'$0').replace(/\$/g,'').replace(/,/g,''))||0; bv = parseNumber((b.querySelector('.ganancia-total')?.textContent||'$0').replace(/\$/g,'').replace(/,/g,''))||0; break;
            default: return 0;
        }
        if (typeof av === 'string') {
            return dir === 'asc' ? collator.compare(av,bv) : collator.compare(bv,av);
        } else {
            return dir === 'asc' ? av - bv : bv - av;
        }
    });

    rows.forEach(r => tbody.appendChild(r));
    saveDataToLocalStorageDebounced();
}

/* ---------- Drag & Drop ---------- */
let draggedRow = null;
function dragStart(e) {
    draggedRow = e.currentTarget;
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'drag'); } catch (err) {}
    draggedRow.style.opacity = '0.5';
}

function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function dragEnter(e) {
    const tr = e.target.closest('tr');
    if (tr && tr !== draggedRow) tr.style.backgroundColor = '#f6f9fc';
}
function dragLeave(e) {
    const tr = e.target.closest('tr');
    if (tr) tr.style.backgroundColor = '';
}
function drop(e) {
    e.preventDefault();
    const target = e.target.closest('tr');
    if (!target || !draggedRow || target === draggedRow) return;
    const tbody = target.parentElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height/2;
    if (e.clientY < midpoint) tbody.insertBefore(draggedRow, target);
    else tbody.insertBefore(draggedRow, target.nextSibling);

    draggedRow.style.opacity = '';
    Array.from(document.querySelectorAll('#tableBody tr')).forEach(r => r.style.backgroundColor = '');
    saveDataToLocalStorageDebounced();
    draggedRow = null;
}
function dragEnd(e) {
    if (draggedRow) draggedRow.style.opacity = '';
    draggedRow = null;
}
function initDragAndDrop() {
    const tbody = document.getElementById('tableBody');
    tbody.addEventListener('dragover', dragOver);
    tbody.addEventListener('drop', drop);
    tbody.addEventListener('dragenter', dragEnter);
    tbody.addEventListener('dragleave', dragLeave);
}

/* ---------- Layout helpers ---------- */
function adjustProductColumnWidth() {
    const texts = document.querySelectorAll('.producto-text');
    let maxw = 200;
    texts.forEach(t=>{
        const span = document.createElement('span');
        span.style.visibility='hidden'; span.style.position='absolute';
        span.style.whiteSpace='nowrap'; span.style.fontSize='14px';
        span.textContent = t.textContent || '';
        document.body.appendChild(span);
        const w = span.offsetWidth;
        document.body.removeChild(span);
        if (w+40 > maxw) maxw = Math.min(w+40, 900);
    });
    const th = document.querySelector('#inventoryTable th:nth-child(3)');
    if (th) th.style.minWidth = maxw + 'px';
}

/* ---------- Export / Import ---------- */
function exportToCSV() {
    let csv = 'Proveedor,Producto,Link,Unid/Paq,PrecioPaquete,CostoUnitario,PrecioVenta,GananciaUnitaria,Margen,StockPaquetes,Inversion,GananciaTotal\n';
    document.querySelectorAll('#tableBody tr').forEach(tr=>{
        const proveedor = (tr.querySelector('.proveedor-name')?.textContent || '').replace(/"/g,'""');
        const producto = (tr.querySelector('.producto-text')?.textContent || '').replace(/"/g,'""');
        const link = (tr.querySelector('.link-input')?.value || '').replace(/"/g,'""');
        const unidades = parseNumber(tr.querySelector('.unidades-input')?.value,0);
        const precioPaquete = parseNumber(tr.querySelector('.precio-paquete-input')?.value,0);
        const costoUnitario = parseNumber((tr.querySelector('.costo-unitario')?.textContent || '$0').replace(/\$/g,''),0);
        const precioVenta = parseNumber(tr.querySelector('.precio-venta-input')?.value,0);
        const gananciaUnit = parseNumber((tr.querySelector('.ganancia-unitaria')?.textContent || '$0').replace(/\$/g,''),0);
        const margen = tr.querySelector('.margen')?.textContent || '0%';
        const stock = parseNumber(tr.querySelector('.stock-paquetes-input')?.value,0);
        const inversion = parseNumber((tr.querySelector('.inversion')?.textContent || '$0').replace(/\$/g,''),0);
        const ganTotal = parseNumber((tr.querySelector('.ganancia-total')?.textContent || '$0').replace(/\$/g,''),0);
        csv += `"${proveedor}","${producto}","${link}",${unidades},${precioPaquete},${costoUnitario},${precioVenta},${gananciaUnit},"${margen}",${stock},${inversion},${ganTotal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventario_dulces.csv'; a.click();
    URL.revokeObjectURL(url);
}

function saveDataToFile() {
    const data = { proveedores, productos: getTableData(), margenGlobal: document.getElementById('margenGlobal').value, lastSaved: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventario_dulces.json'; a.click();
    URL.revokeObjectURL(url);
    alert('Datos exportados a inventario_dulces.json');
}

function loadData() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.proveedores && data.productos) {
                    proveedores = data.proveedores; productos = data.productos;
                    updateProviderSelect(); loadTableData();
                    if (data.margenGlobal) document.getElementById('margenGlobal').value = data.margenGlobal;
                    saveDataToLocalStorageDebounced();
                    alert('Datos importados correctamente');
                } else {
                    alert('Formato inválido');
                }
            } catch(err) { alert('Error leyendo archivo: '+err.message); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function filterTable() {
    const v = document.getElementById('filterProveedor').value.toUpperCase();
    document.querySelectorAll('#tableBody tr').forEach(tr=>{
        const val = (tr.querySelector('.proveedor-name')?.textContent || '').toUpperCase();
        tr.style.display = (!v || val === v) ? '' : 'none';
    });
}

function updateLinkButton(input) {
    const row = input.closest('tr');
    const btn = row.querySelector('.link-button');
    btn.disabled = !input.value.trim();
}

/* ---------- Apply global margin ---------- */
function applyGlobalMargin() {
    const margen = parseNumber(document.getElementById('margenGlobal').value, 0);
    if (margen <= 0) { alert('Por favor ingrese un margen válido mayor a 0'); return; }
    document.querySelectorAll('#tableBody tr').forEach(tr=>{
        const unidades = parseNumber(tr.querySelector('.unidades-input')?.value)||0;
        const precioPaquete = parseNumber(tr.querySelector('.precio-paquete-input')?.value)||0;
        if (unidades > 0 && precioPaquete > 0) {
            const costoUnitario = precioPaquete / unidades;
            const precioVentaConMargen = Math.round(costoUnitario * (1 + margen/100));
            tr.querySelector('.precio-venta-input').value = precioVentaConMargen;
            calculateRow(tr.querySelector('.precio-venta-input'));
        }
    });
    alert(`Margen del ${margen}% aplicado a todos los productos`);
    saveDataToLocalStorageDebounced();
}

/* ---------- Init & wiring ---------- */
function init() {
    // restore or load defaults
    if (!loadDataFromLocalStorage()) {
        updateProviderSelect();
        loadTableData();
    }
    initDragAndDrop();
    adjustProductColumnWidth();
    document.getElementById('btnSortToggle').textContent = '↓';

    // wiring controls
    document.getElementById('btnAdd').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); showAddProductModal(); });
    document.getElementById('btnRecalc').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); calculateAll(); saveDataToLocalStorageDebounced(); });
    document.getElementById('btnExportCSV').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); exportToCSV(); });
    document.getElementById('btnExportJSON').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); saveDataToFile(); });
    document.getElementById('btnLoad').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); loadData(); });
    document.getElementById('btnProviders').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); showProviderModal(); });

    document.getElementById('btnApplyMargin').addEventListener('click', ()=>{ markButtonActive(event.currentTarget); applyGlobalMargin(); });

    document.getElementById('sortCategory').addEventListener('change', ()=> sortTable(document.getElementById('sortCategory').value, currentSortDirection));
    document.getElementById('btnSortToggle').addEventListener('click', ()=> toggleSort());
    document.getElementById('filterProveedor').addEventListener('change', ()=> filterTable());

    // provider modal wiring
    document.getElementById('addProviderBtn').addEventListener('click', ()=> addProvider());
    document.getElementById('btnProviders').addEventListener('click', ()=> showProviderModal());
    document.getElementById('closeProviderModal').addEventListener('click', ()=> closeProviderModal());

    // add product modal wiring
    document.getElementById('createProductBtn').addEventListener('click', ()=> {
        markButtonActive(event.currentTarget);
        createNewProduct();
    });
    document.getElementById('btnAdd').addEventListener('click', ()=> showAddProductModal());
    document.getElementById('cancelCreateProductBtn').addEventListener('click', ()=> { markButtonActive(event.currentTarget); closeAddProductModal(); });
    document.getElementById('closeAddProductModal').addEventListener('click', ()=> closeAddProductModal());
}

function createNewProduct() {
    const proveedor = document.getElementById('newProductProvider').value;
    const producto = document.getElementById('newProductName').value.trim();
    const link = document.getElementById('newProductLink').value.trim();
    const unidades = parseNumber(document.getElementById('newProductUnits').value,1);
    const precioPaquete = parseNumber(document.getElementById('newProductPrice').value,0);
    const stock = parseNumber(document.getElementById('newProductStock').value,0);
    if (!producto) { alert('Ingrese nombre del producto'); return; }
    addRowWithData({proveedor, producto, link, unidades, precioPaquete, precioVenta:0, stock}, true);
    closeAddProductModal();
    saveDataToLocalStorageDebounced();
}

/* expose some functions for inline usage (keeps compat con HTML original if se requiere) */
window.showAddProductModal = showAddProductModal;
window.showProviderModal = showProviderModal;
window.closeAddProductModal = closeAddProductModal;
window.closeProviderModal = closeProviderModal;
window.addProvider = addProvider;
window.createNewProduct = createNewProduct;
window.saveDataToFile = saveDataToFile;
window.loadData = loadData;
window.exportToCSV = exportToCSV;
window.applyGlobalMargin = applyGlobalMargin;

init();