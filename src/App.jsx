import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, MapPin, User, CheckCircle, Utensils, Home,
  Plus, Trash2, X, Package, ClipboardList, Pencil, Settings, 
  Bike, MessageCircle, Map, DollarSign, Users, 
  ChefHat, TrendingUp, Clock,
  Flame, UserPlus, Phone, Percent, Play, Calendar,
  Edit3, CheckSquare, Square, Layers, Wand2, Image as ImageIcon
} from 'lucide-react';

// --- CONFIGURAÇÃO DE SOM ---
const SOM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

// --- COMPONENTES VISUAIS (DESIGN DARK PREMIUM) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = {
    'Pendente': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Saiu para Entrega': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Concluido': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Cancelado': 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${styles[status] || styles['Pendente']} flex items-center gap-1 w-fit tracking-wide`}>
      {status === 'Saiu para Entrega' && <Bike size={10}/>}
      {status === 'Concluido' && <CheckCircle size={10}/>}
      {status ? status : 'UNK'}
    </span>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard'); 
  const [filtroCardapio, setFiltroCardapio] = useState('Lanches');
  const [modalPedidoAberto, setModalPedidoAberto] = useState(false);
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalMonteDogAberto, setModalMonteDogAberto] = useState(false);

  // --- STATE: APENAS LOGO (DARK MODE REMOVIDO, AGORA É PADRÃO) ---
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('bd_logo_url') || '');

  // --- UTILITÁRIOS ---
  const getDataHoje = () => new Date().toISOString().split('T')[0];
  const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const carregarDados = (chave, padrao) => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo ? JSON.parse(salvo) : padrao;
    } catch (e) { return padrao; }
  };
  
  const tocarSom = () => {
      try {
        const audio = document.getElementById('audio-alerta');
        if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      } catch(e){}
  };

  // EFEITOS
  useEffect(() => { document.documentElement.classList.add('dark'); }, []); // Força classe dark no HTML
  useEffect(() => { localStorage.setItem('bd_logo_url', logoUrl); }, [logoUrl]);

  // --- ESTADOS GLOBAIS ---
  const [taxasFrete, setTaxasFrete] = useState(() => carregarDados('bd_v35_taxas', [{ id: 1, nome: "Bairro Vizinho", valor: 5.00 }, { id: 2, nome: "Centro", valor: 8.00 }]));
  const [produtos, setProdutos] = useState(() => carregarDados('bd_v35_produtos', [
    { id: 1, nome: "Dogão Simples", descricao: "Pão, salsicha, purê...", preco: 18.00, estoque: 50, opcoes: "Salsicha, Vina Dupla =+4.00", tipo: 'principal', categoria: 'Lanches' },
    { id: 2, nome: "Coca-Cola Lata", preco: 6.00, estoque: 24, opcoes: "", tipo: 'principal', categoria: 'Bebidas' },
  ]));
  const [clientes, setClientes] = useState(() => carregarDados('bd_v35_clientes', []));
  const [pedidos, setPedidos] = useState(() => carregarDados('bd_v35_pedidos', []));
  const [configMontagem, setConfigMontagem] = useState(() => carregarDados('bd_v35_montagem', {
      paes: [{id: 1, nome: 'Pão de Leite', valor: 0}, {id: 2, nome: 'Pão Australiano', valor: 2.00}],
      queijos: [{id: 1, nome: 'Mussarela', valor: 0}, {id: 2, nome: 'Cheddar', valor: 3.00}],
      salsichas: [{id: 1, nome: 'Tradicional', valor: 0}],
      molhos: [{id: 1, nome: 'Maionese Verde', valor: 0}, {id: 2, nome: 'Ketchup', valor: 0}],
      adicionais: [{id: 1, nome: 'Bacon', valor: 3.00}, {id: 2, nome: 'Purê', valor: 0}]
  }));
  const [filtroData, setFiltroData] = useState(getDataHoje());
  
  // Auxiliares
  const [novaTaxa, setNovaTaxa] = useState({ nome: '', valor: '' });
  const [novoItemMontagem, setNovoItemMontagem] = useState({ categoria: 'paes', nome: '', valor: '' });

  // PERSISTÊNCIA
  useEffect(() => { localStorage.setItem('bd_v35_taxas', JSON.stringify(taxasFrete)); }, [taxasFrete]);
  useEffect(() => { localStorage.setItem('bd_v35_produtos', JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { localStorage.setItem('bd_v35_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('bd_v35_pedidos', JSON.stringify(pedidos)); }, [pedidos]);
  useEffect(() => { localStorage.setItem('bd_v35_montagem', JSON.stringify(configMontagem)); }, [configMontagem]);

  // --- FORMULÁRIOS ---
  const getFormPedidoInicial = () => ({ 
      id: null, nome: '', endereco: '', telefone: '', taxaEntrega: 0, pagamento: 'Dinheiro', trocoPara: '', observacoes: '', desconto: 0, 
      itens: [{ produtoId: '', nome: '', qtd: 1, preco: 0, opcoesSelecionadas: [], listaAdicionais: [] }] 
  });

  const [formPedido, setFormPedido] = useState(getFormPedidoInicial());
  const formProdutoInicial = { id: null, nome: '', descricao: '', preco: '', estoque: '', opcoes: '', tipo: 'principal', categoria: 'Lanches' };
  const [formProduto, setFormProduto] = useState(formProdutoInicial);
  const formClienteInicial = { id: null, nome: '', telefone: '', endereco: '', obs: '' };
  const [formCliente, setFormCliente] = useState(formClienteInicial);
  const [montagem, setMontagem] = useState({ paoId: '', salsichaId: '', queijoIds: [], molhoIds: [], adicionalIds: [] });

  // --- LÓGICA CRUD ---
  const adicionarItemConfig = () => { if (!novoItemMontagem.nome) return; const cat = novoItemMontagem.categoria; const novoItem = { id: Date.now(), nome: novoItemMontagem.nome, valor: parseFloat(novoItemMontagem.valor || 0) }; setConfigMontagem({ ...configMontagem, [cat]: [...configMontagem[cat], novoItem] }); setNovoItemMontagem({ ...novoItemMontagem, nome: '', valor: '' }); };
  const removerItemConfig = (categoria, id) => { setConfigMontagem({ ...configMontagem, [categoria]: configMontagem[categoria].filter(i => i.id !== id) }); };
  const salvarTaxa = (e) => { e.preventDefault(); if (!novaTaxa.nome || !novaTaxa.valor) return; setTaxasFrete([...taxasFrete, { id: Date.now(), nome: novaTaxa.nome, valor: parseFloat(novaTaxa.valor) }]); setNovaTaxa({ nome: '', valor: '' }); };
  const excluirTaxa = (id) => { if(confirm("Remover taxa?")) setTaxasFrete(taxasFrete.filter(t => t.id !== id)); };
  
  // --- CÁLCULOS ---
  const extrairValorOpcao = (txt) => { if (!txt || !txt.includes('=+')) return 0; return parseFloat(txt.split('=+')[1]) || 0; };
  const extrairNomeOpcao = (txt) => { if (!txt) return ''; return txt.split('=+')[0].trim(); };
  
  const calcularSubtotalItens = (itens) => { 
    if(!itens || !Array.isArray(itens)) return 0; 
    return itens.reduce((acc, item) => { 
      if(!item.produtoId) return acc;
      const pBase = Number(item.preco || 0); 
      const pOpcoes = (item.opcoesSelecionadas || []).reduce((s, op) => s + extrairValorOpcao(op), 0);
      const pAdics = item.listaAdicionais ? item.listaAdicionais.reduce((sum, adId) => { const p = produtos.find(x => x.id === adId); return sum + (p ? Number(p.preco) : 0); }, 0) : 0; 
      return acc + ((pBase + pOpcoes + pAdics) * Number(item.qtd || 1)); 
    }, 0); 
  };

  const calcularTotalPedido = (itens, entrega, descontoPorcentagem) => { 
      const subtotal = calcularSubtotalItens(itens); 
      const valorDesconto = subtotal * ((descontoPorcentagem || 0) / 100); 
      return (subtotal - valorDesconto) + Number(entrega || 0); 
  };

  // --- MONTAGEM ---
  const toggleMultiplo = (campo, id) => { const lista = montagem[campo]; setMontagem({ ...montagem, [campo]: lista.includes(id) ? lista.filter(i => i !== id) : [...lista, id] }); };
  
  const concluirMontagem = () => {
      const pao = configMontagem.paes.find(p => p.id == montagem.paoId) || {nome: 'Pão Padrão', valor: 0};
      const salsicha = configMontagem.salsichas.find(s => s.id == montagem.salsichaId) || {nome: 'Tradicional', valor: 0};
      let totalExtras = 0;
      
      let detalhes = [];
      detalhes.push(`> ${pao.nome} ${pao.valor > 0 ? `(+${formatarMoeda(pao.valor)})` : ''}`);
      detalhes.push(`> ${salsicha.nome} ${salsicha.valor > 0 ? `(+${formatarMoeda(salsicha.valor)})` : ''}`);

      const pushItem = (id, listaOrigem) => {
          const item = listaOrigem.find(x => x.id == id);
          if(item){
              totalExtras += item.valor;
              detalhes.push(`+ ${item.nome} ${item.valor > 0 ? `(+${formatarMoeda(item.valor)})` : ''}`);
          }
      };

      montagem.queijoIds.forEach(id => pushItem(id, configMontagem.queijos));
      montagem.molhoIds.forEach(id => pushItem(id, configMontagem.molhos));
      montagem.adicionalIds.forEach(id => pushItem(id, configMontagem.adicionais));

      const precoBaseFix = 15.00; 
      const precoFinal = parseFloat((precoBaseFix + pao.valor + salsicha.valor + totalExtras).toFixed(2));
      const descFinal = detalhes.join('\n');

      const itemMontado = { 
          produtoId: 999, 
          nome: `Dog Montado`, 
          preco: precoFinal, 
          qtd: 1, 
          opcoesSelecionadas: [descFinal], 
          listaAdicionais: [] 
      };
      
      const itensLimpos = formPedido.itens.filter(i => i.produtoId && i.produtoId !== "");
      setFormPedido({ ...formPedido, itens: [...itensLimpos, itemMontado] }); 
      setModalMonteDogAberto(false); 
      setModalPedidoAberto(true);
  };

  // --- AÇÕES CRUD PEDIDO ---
  const salvarPedido = (e) => {
    e.preventDefault();
    const itensValidos = formPedido.itens.filter(i => i.produtoId);

    if (itensValidos.length === 0) { alert("⚠️ Adicione itens ao pedido!"); return; }
    if (!formPedido.nome) { alert("⚠️ Nome obrigatório!"); return; }
    
    const pedidoFmt = { 
        ...formPedido,
        itens: itensValidos,
        id: formPedido.id || Math.floor(Math.random() * 100000), 
        total: calcularTotalPedido(itensValidos, formPedido.taxaEntrega, formPedido.desconto), 
        data: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.data : getDataHoje(), 
        hora: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.hora : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
        status: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.status : "Pendente", 
        cliente: { nome: formPedido.nome, endereco: formPedido.endereco, telefone: formPedido.telefone } 
    };

    if (formPedido.id) setPedidos(pedidos.map(p => p.id === formPedido.id ? pedidoFmt : p));
    else { 
        setPedidos([pedidoFmt, ...pedidos]); 
        tocarSom(); 
    }
    setFormPedido(getFormPedidoInicial());
    setModalPedidoAberto(false);
  };

  const baixarEstoque = (pedido) => { const novosProds = [...produtos]; pedido.itens.forEach(item => { const idx = novosProds.findIndex(p => p.id == item.produtoId); if(idx >= 0) novosProds[idx].estoque = Math.max(0, (novosProds[idx].estoque || 0) - item.qtd); item.listaAdicionais?.forEach(adId => { const idxAd = novosProds.findIndex(p => p.id == adId); if(idxAd >= 0) novosProds[idxAd].estoque = Math.max(0, (novosProds[idxAd].estoque || 0) - item.qtd); }); }); setProdutos(novosProds); };
  const avançarStatus = (id) => { const pedido = pedidos.find(p => p.id === id); if(!pedido) return; if(pedido.status === 'Pendente') { setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'Saiu para Entrega' } : p)); setTimeout(() => { enviarZap({ ...pedido, status: 'Saiu para Entrega' }); }, 100); } else if (pedido.status === 'Saiu para Entrega') { setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'Concluido' } : p)); baixarEstoque(pedido); } };
  const cancelarPedido = (id) => { if(confirm("Cancelar?")) setPedidos(pedidos.map(p => p.id === id ? { ...p, status: 'Cancelado' } : p)); };
  const salvarCliente = (e) => { e.preventDefault(); const c = { ...formCliente, id: formCliente.id || Date.now() }; formCliente.id ? setClientes(clientes.map(cli => cli.id === c.id ? c : cli)) : setClientes([...clientes, c]); setModalClienteAberto(false); };
  const excluirCliente = (id) => { if(confirm("Apagar?")) setClientes(clientes.filter(c => c.id !== id)); };
  const salvarProduto = (e) => { e.preventDefault(); let tipo = formProduto.tipo; if(formProduto.categoria === 'Adicionais') tipo = 'adicional'; const p = { ...formProduto, id: formProduto.id || Date.now(), preco: parseFloat(formProduto.preco||0), estoque: parseInt(formProduto.estoque||0), tipo, descricao: formProduto.descricao || '' }; formProduto.id ? setProdutos(produtos.map(prod => prod.id === p.id ? p : prod)) : setProdutos([...produtos, p]); setModalProdutoAberto(false); };
  const excluirProduto = (id) => { if(confirm("Excluir?")) setProdutos(produtos.filter(p => p.id !== id)); };

  const pedidosHoje = useMemo(() => pedidos.filter(p => p.data === getDataHoje()), [pedidos]);
  const pedidosPendentes = useMemo(() => pedidos.filter(p => p.status !== 'Concluido' && p.status !== 'Cancelado'), [pedidos]);
  const kpis = useMemo(() => { const concluidos = pedidosHoje.filter(p => p.status === 'Concluido'); const total = concluidos.reduce((acc, p) => acc + (p.total || 0), 0); return { totalHoje: total, qtdHoje: concluidos.length, ticketMedio: concluidos.length > 0 ? total / concluidos.length : 0 }; }, [pedidosHoje]);

  // --- UI HELPERS ---
  const abrirNovoPedido = () => { setFormPedido(getFormPedidoInicial()); setModalPedidoAberto(true); };
  const abrirMonteDog = () => { 
      setFormPedido(getFormPedidoInicial());
      const pId = configMontagem.paes[0]?.id; 
      const sId = configMontagem.salsichas[0]?.id; 
      setMontagem({ paoId: pId, salsichaId: sId, queijoIds: [], molhoIds: [], adicionalIds: [] }); 
      setModalMonteDogAberto(true); 
  };
  
  const abrirNovoProduto = () => { setFormProduto({ ...formProdutoInicial, categoria: filtroCardapio === 'Adicionais' ? 'Adicionais' : filtroCardapio, tipo: filtroCardapio === 'Adicionais' ? 'adicional' : 'principal' }); setModalProdutoAberto(true); };
  const abrirNovoCliente = () => { setFormCliente(formClienteInicial); setModalClienteAberto(true); };
  const editarPedido = (p) => { setFormPedido({...p, itens: p.itens || [], clienteId: null}); setModalPedidoAberto(true); }; 
  const editarCliente = (c) => { setFormCliente(c); setModalClienteAberto(true); };
  const editarProduto = (p) => { setFormProduto(p); setModalProdutoAberto(true); };
  const selecionarClienteNoPedido = (id) => { const c = clientes.find(x => x.id == id); if(c) setFormPedido({...formPedido, clienteId: c.id, nome: c.nome, endereco: c.endereco, telefone: c.telefone, taxaEntrega: c.taxaFixa || 0}); };
  const atualizarItem = (idx, f, v) => { const ns = [...formPedido.itens]; ns[idx][f] = v; if(f === 'produtoId') { const p = produtos.find(x => x.id == v); if(p) { ns[idx].nome = p.nome; ns[idx].preco = p.preco; ns[idx].opcoesSelecionadas = []; ns[idx].listaAdicionais = []; } } setFormPedido({...formPedido, itens: ns}); };
  const toggleAdicionalItem = (idx, id) => { const ns = [...formPedido.itens]; const l = ns[idx].listaAdicionais || []; ns[idx].listaAdicionais = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; setFormPedido({...formPedido, itens: ns}); };
  const toggleOpcaoItem = (idx, opcao) => { const ns = [...formPedido.itens]; const atuais = ns[idx].opcoesSelecionadas || []; if (atuais.includes(opcao)) { ns[idx].opcoesSelecionadas = atuais.filter(o => o !== opcao); } else { ns[idx].opcoesSelecionadas = [...atuais, opcao]; } setFormPedido({...formPedido, itens: ns}); };

  const enviarZap = (p) => {
    let msgTroco = "";
    if(p.pagamento === 'Dinheiro' && p.trocoPara) msgTroco = `\n💵 *Troco p/ ${formatarMoeda(p.trocoPara)}* (Devolver: ${formatarMoeda(Number(p.trocoPara) - p.total)})`;
    else if (p.pagamento !== 'Dinheiro') msgTroco = `\n💳 Levar Maquininha (${p.pagamento})`;
    const saudacao = p.status === 'Saiu para Entrega' ? `🛵 *SEU PEDIDO SAIU!*` : `Olá ${p.cliente?.nome || ''}! 🌭🔥`;
    const txt = `${saudacao}\n\n*PEDIDO #${p.id}*\n📍 ${p.cliente?.endereco || 'Balcão'}\n\n${p.itens.map(i => `${i.qtd}x ${i.nome}\n   ${(i.opcoesSelecionadas||[]).join('\n   ')}`).join('\n')}\n\n💰 *Total: ${formatarMoeda(p.total)}*${msgTroco}`;
    window.open(`https://wa.me/55${p.cliente?.telefone?.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const abrirNoMaps = (end) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`, '_blank');
  
  // --- IMPRESSÃO OTIMIZADA ---
  const imprimir = (p) => {
    const subtotal = calcularSubtotalItens(p.itens);
    const descontoVal = subtotal * ((p.desconto || 0) / 100);
    const totalFinal = (subtotal - descontoVal) + Number(p.taxaEntrega);
    const troco = p.trocoPara ? Number(p.trocoPara) - totalFinal : 0;

    const conteudoHtml = `
      <html><head><meta charset="utf-8"><style>
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 5px; font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 72mm; background: #fff; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .title { font-size: 20px; font-weight: 900; margin: 0; }
          .meta { font-size: 12px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
          .section { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
          .client-name { font-size: 16px; font-weight: 800; text-transform: uppercase; }
          .client-address { font-size: 14px; margin-top: 4px; font-weight: 600; line-height: 1.2; }
          .item-box { padding: 6px 0; border-bottom: 1px dotted #999; }
          .item-header { font-size: 14px; font-weight: 800; display: flex; justify-content: space-between; }
          .item-details { margin-top: 2px; font-size: 12px; color: #000; white-space: pre-wrap; line-height: 1.2; padding-left: 8px; }
          .totals { margin-top: 10px; }
          .row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 2px; }
          .total-final { font-size: 24px; font-weight: 900; text-align: right; border-top: 2px solid #000; margin-top: 10px; padding-top: 5px; }
          .payment { font-size: 14px; border: 2px solid #000; padding: 5px; text-align: center; font-weight: 800; margin-top: 10px; background: #eee; }
          .obs { background: #000; color:#fff; padding: 5px; font-weight: bold; font-size: 14px; text-align: center; margin-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style></head><body>
        <div class="header"><div class="title">BEST DOG</div><div class="meta"><span>#${p.id}</span><span>${p.hora}</span></div></div>
        <div class="section"><div class="client-name">${p.cliente?.nome || 'CLIENTE BALCÃO'}</div><div class="client-address">${p.cliente?.endereco || 'Retirada'}</div><div>${p.cliente?.telefone || ''}</div></div>
        <div class="section">${p.itens.map(i => {
               const pBase = Number(i.preco||0);
               const pOpcoes=(i.opcoesSelecionadas||[]).reduce((s,op)=>s+extrairValorOpcao(op),0);
               const pAdics=i.listaAdicionais?i.listaAdicionais.reduce((s,adId)=>{const pr=produtos.find(x=>x.id===adId);return s+(pr?Number(pr.preco):0)},0):0;
               const totalItem=(pBase+pOpcoes+pAdics)*i.qtd;
               let detalhesTexto="";
               if(i.produtoId===999){ detalhesTexto=i.opcoesSelecionadas?i.opcoesSelecionadas[0]:"" } 
               else { if(i.opcoesSelecionadas&&i.opcoesSelecionadas.length>0){i.opcoesSelecionadas.forEach(op=>detalhesTexto+=`> ${extrairNomeOpcao(op)}\n`)} if(i.listaAdicionais?.length>0)i.listaAdicionais.forEach(adId=>{const ad=produtos.find(x=>x.id===adId);if(ad)detalhesTexto+=`+ ${ad.nome} (${formatarMoeda(ad.preco)})\n`}) }
               return `<div class="item-box"><div class="item-header"><span>${i.qtd}x ${i.nome.toUpperCase()}</span><span>${formatarMoeda(totalItem)}</span></div>${detalhesTexto?`<div class="item-details">${detalhesTexto}</div>`:''}</div>`
        }).join('')}</div>
        ${p.observacoes ? `<div class="obs">OBS: ${p.observacoes.toUpperCase()}</div>` : ''}
        <div class="totals"><div class="row"><span>Subtotal</span><span>${formatarMoeda(subtotal)}</span></div>${p.desconto > 0 ? `<div class="row"><span>Desc. (${p.desconto}%)</span><span>- ${formatarMoeda(descontoVal)}</span></div>` : ''}<div class="row"><span>Entrega</span><span>${formatarMoeda(Number(p.taxaEntrega))}</span></div><div class="total-final">TOTAL: ${formatarMoeda(totalFinal)}</div><div class="payment">${p.pagamento}${p.pagamento==='Dinheiro'&&p.trocoPara?`<br>Troco p/ ${formatarMoeda(p.trocoPara)}<br>Devolver: ${formatarMoeda(troco)}`:''}</div></div>
        <div style="text-align:center; margin-top:10px; font-size:10px;">*** Obrigado pela preferência! ***</div></body></html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
        win.document.write(conteudoHtml);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
    } else { alert("Pop-up bloqueado! Permita pop-ups para imprimir."); }
  };

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-red-600 selection:text-white">
      <audio id="audio-alerta" src={SOM_URL} />

      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover ring-2 ring-zinc-700"/> : <div className="bg-gradient-to-br from-yellow-500 to-red-600 p-2 rounded-xl shadow-lg transform -rotate-6"><Utensils size={24} className="text-white"/></div>}
          <div><h1 className="font-extrabold text-2xl tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">BEST DOG</h1><p className="text-xs text-zinc-500 font-bold">Premium v44.0</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {[ { id: 'dashboard', icon: Home, label: 'Visão Geral' }, { id: 'montagem', icon: Layers, label: 'Monte seu Dog' }, { id: 'pedidos', icon: ClipboardList, label: 'Pedidos', count: pedidosPendentes.length }, { id: 'vendas', icon: DollarSign, label: 'Gestão' }, { id: 'produtos', icon: Package, label: 'Cardápio' }, { id: 'clientes', icon: Users, label: 'Clientes' }, { id: 'config', icon: Settings, label: 'Configurações' }].map(item => (
             <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ${abaAtiva === item.id ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-400 border border-red-900/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
               <div className="flex items-center gap-3"><item.icon size={20} className={abaAtiva === item.id ? 'text-red-500' : ''}/> <span>{item.label}</span></div>
               {item.id === 'pedidos' && item.count > 0 && <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-900/50">{item.count}</span>}
             </button>
           ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col bg-zinc-950">
        <header className="md:hidden bg-zinc-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10 border-b border-zinc-800">
           <div className="flex items-center gap-2 font-extrabold italic text-xl">{logoUrl ? <img src={logoUrl} className="w-8 h-8 rounded ring-1 ring-zinc-700"/> : <Utensils className="text-yellow-500"/>} BEST DOG</div>
           {pedidosPendentes.length > 0 && <span className="text-xs bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-sm">{pedidosPendentes.length}</span>}
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
            {abaAtiva === 'dashboard' && (
              <div className="space-y-4">
                 <button onClick={abrirNovoPedido} className="w-full bg-gradient-to-br from-red-600 to-orange-600 text-white py-5 rounded-2xl shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-orange-500 transition transform active:scale-95 font-black text-xl md:text-2xl flex justify-center items-center gap-3 border border-red-500/30"><Plus size={32} strokeWidth={3} className="bg-white/20 rounded-full p-1"/> NOVO PEDIDO AGORA</button>
                 <button onClick={abrirMonteDog} className="w-full py-4 bg-indigo-900/50 text-indigo-200 font-extrabold rounded-xl border border-indigo-500/30 hover:bg-indigo-900 hover:text-white flex justify-center items-center gap-3 active:scale-95 transition-all"><Wand2 size={22} className="text-indigo-400"/> MONTE SEU DOG (Personalizado)</button>
                 <div className="mt-4">
                    <h3 className="font-extrabold text-zinc-400 flex items-center gap-2 mb-3 uppercase text-sm tracking-wider"><Flame size={18} className="text-orange-500"/> Fila de Produção ({pedidosPendentes.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {pedidosPendentes.length === 0 ? <div className="col-span-full text-center p-10 bg-zinc-900 rounded-xl border border-zinc-800 border-dashed text-zinc-600 italic">Nenhum pedido na chapa...</div> : pedidosPendentes.map(p => (
                           <div key={p.id} className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 flex flex-col relative overflow-hidden hover:border-zinc-700 transition-all">
                              <div className={`h-1 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                              <div className="p-3 flex flex-col gap-1">
                                 <div className="flex justify-between items-center"><span className="font-black text-white text-lg">#{p.id}</span><div className="flex items-center gap-2"><button onClick={() => abrirNoMaps(p.cliente?.endereco || '')} className="text-blue-400 bg-blue-900/20 p-1 rounded hover:bg-blue-900/40"><Map size={14}/></button><Badge status={p.status}/></div></div>
                                 <div className="text-sm font-bold text-zinc-300 truncate">{p.cliente?.nome || 'Cliente'}</div>
                                 <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><Utensils size={10}/> {(p.itens||[]).length} itens • {p.hora}</div>
                                 <div className="text-xs text-zinc-400 bg-zinc-950 border-l-4 border-zinc-700 pl-2 py-1 mb-2 font-medium">{(p.itens||[]).map(i => `${i.qtd}x ${i.nome}`).join(', ').substring(0, 60)}{p.itens?.length > 2 ? '...' : ''}</div>
                                 <div className="flex justify-between items-end mt-auto pt-2 border-t border-zinc-800">
                                    <div><div className="text-[10px] uppercase text-zinc-500 font-bold">{p.pagamento}</div><div className="font-black text-red-500 text-lg">{formatarMoeda(p.total)}</div></div>
                                    <div className="flex gap-1"><button onClick={() => imprimir(p)} className="p-1.5 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"><Printer size={14}/></button><button onClick={() => enviarZap(p)} className="p-1.5 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"><MessageCircle size={14}/></button><button onClick={() => editarPedido(p)} className="p-1.5 bg-amber-900/30 text-amber-500 rounded hover:bg-amber-900/50"><Pencil size={14}/></button></div>
                                 </div>
                              </div>
                              <button onClick={() => avançarStatus(p.id)} className={`w-full py-2 text-xs font-bold text-white flex items-center justify-center gap-1 ${p.status === 'Pendente' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{p.status === 'Pendente' ? <><ArrowRight size={14}/> MANDAR ENTREGA</> : <><CheckCircle size={14}/> CONCLUIR</>}</button>
                           </div>
                        ))}
                    </div>
                 </div>
              </div>
            )}

            {abaAtiva === 'pedidos' && <div className="space-y-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-zinc-100">Lista Detalhada</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pedidosPendentes.map(p => (<div key={p.id} className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col"><div className={`h-1 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div><div className="p-5 flex-1 flex flex-col gap-3"><div className="flex justify-between items-center"><span className="font-black text-zinc-500 text-xs tracking-wider">#{p.id}</span><span className="text-xs font-bold text-zinc-500 flex items-center gap-1"><Clock size={12}/> {p.hora}</span></div><div><Badge status={p.status}/></div><div><div className="font-bold text-zinc-100 text-lg leading-tight">{p.cliente?.nome}</div><div className="text-xs text-zinc-400 mt-1 flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0 text-red-500"/><span className="line-clamp-2">{p.cliente?.endereco}</span></div></div><div className="bg-zinc-950 rounded-lg p-3 text-sm border border-zinc-800 mt-1 flex-1 text-zinc-300">{(p.itens||[]).map((i, idx) => (<div key={idx} className="flex justify-between items-start border-b border-zinc-800 last:border-0 pb-1 last:pb-0 mb-1 last:mb-0"><span className="font-bold text-red-500 w-6">{i.qtd}x</span><span className="text-zinc-300 flex-1 leading-tight">{i.nome}</span></div>))}{p.observacoes && <div className="mt-2 pt-2 border-t border-zinc-800 text-[10px] text-orange-500 font-bold uppercase">Obs: {p.observacoes}</div>}</div></div><div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-between items-center"><div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-500 uppercase">Total</span><span className="font-black text-xl text-zinc-100">{formatarMoeda(p.total)}</span></div><div className="flex gap-2"><button onClick={() => imprimir(p)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-700"><Printer size={14}/></button><button onClick={() => editarPedido(p)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-700">Editar</button><button onClick={() => cancelarPedido(p.id)} className="px-3 py-1.5 bg-red-900/20 border border-red-900/40 text-red-400 rounded-lg text-xs font-bold hover:bg-red-900/30">Cancelar</button></div></div></div>))}</div></div>}
            {abaAtiva === 'vendas' && <div className="space-y-6"><div className="grid grid-cols-3 gap-2"><Card className="p-3 bg-zinc-900 border-zinc-800"><span className="text-xs font-bold text-green-500">Faturamento</span><h3 className="text-xl font-black text-white">{formatarMoeda(kpis.totalHoje)}</h3></Card><Card className="p-3 bg-zinc-900 border-zinc-800"><span className="text-xs font-bold text-yellow-500">Pedidos</span><h3 className="text-xl font-black text-white">{kpis.qtdHoje}</h3></Card><Card className="p-3 bg-zinc-900 border-zinc-800"><span className="text-xs font-bold text-red-500">Ticket Médio</span><h3 className="text-xl font-black text-white">{formatarMoeda(kpis.ticketMedio)}</h3></Card></div><div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800"><input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="bg-zinc-950 text-white border border-zinc-700 rounded p-2 w-full"/></div><Card className="p-0 bg-zinc-900"><table className="w-full text-xs text-left text-zinc-300"><thead className="bg-zinc-950 text-zinc-500"><tr><th className="p-2">#</th><th className="p-2">Nome</th><th className="p-2 text-right">R$</th></tr></thead><tbody className="divide-y divide-zinc-800">{pedidos.filter(p => (p.status === 'Concluido' || p.status === 'Cancelado') && p.data === filtroData).map(p => <tr key={p.id}><td className="p-2">#{p.id}</td><td className="p-2">{p.cliente?.nome}</td><td className="p-2 text-right text-emerald-400">{formatarMoeda(p.total)}</td></tr>)}</tbody></table></Card></div>}
            {abaAtiva === 'produtos' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold text-white">Cardápio</h2><button onClick={abrirNovoProduto} className="bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-gray-200">Add</button></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['Lanches','Bebidas','Combos','Adicionais'].map(c => <button key={c} onClick={() => setFiltroCardapio(c)} className={`px-3 py-1 rounded-full text-xs border ${filtroCardapio===c?'bg-red-600 text-white border-red-600':'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'}`}>{c}</button>)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{produtos.filter(p => {if(filtroCardapio==='Adicionais')return p.tipo==='adicional'; return p.categoria===filtroCardapio && p.tipo!=='adicional'}).map(p => <div key={p.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-center"><div><div className="font-bold text-sm text-zinc-200">{p.nome}</div><div className="text-xs text-zinc-500">{formatarMoeda(p.preco)} • Est: {p.estoque}</div></div><div className="flex gap-2"><button onClick={() => editarProduto(p)} className="p-2 bg-zinc-800 text-zinc-300 rounded"><Pencil size={14}/></button><button onClick={() => excluirProduto(p.id)} className="p-2 bg-red-900/30 text-red-400 rounded"><Trash2 size={14}/></button></div></div>)}</div></div>}
            {abaAtiva === 'clientes' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold text-white">Clientes</h2><button onClick={abrirNovoCliente} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-500">Add</button></div><div className="grid grid-cols-1 gap-2">{clientes.map(c => <div key={c.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex justify-between items-center"><div><div className="font-bold text-sm text-zinc-200">{c.nome}</div><div className="text-xs text-zinc-500">{c.telefone}</div></div><div className="flex gap-2"><button onClick={() => editarCliente(c)} className="p-2 bg-zinc-800 text-zinc-300 rounded"><Pencil size={14}/></button><button onClick={() => excluirCliente(c.id)} className="p-2 bg-red-900/30 text-red-400 rounded"><Trash2 size={14}/></button></div></div>)}</div></div>}
            {abaAtiva === 'montagem' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-extrabold text-indigo-400 italic flex items-center gap-2"><Layers/> Itens de Montagem</h2></div>
                  <Card className="p-4 bg-indigo-900/20 border-indigo-900/40">
                     <h4 className="font-bold text-indigo-300 text-sm mb-2">Cadastrar Opção</h4>
                     <div className="flex gap-2 mb-2">
                        <select className="border border-indigo-900/40 bg-zinc-900 text-zinc-200 rounded p-2 text-xs w-32" value={novoItemMontagem.categoria} onChange={e => setNovoItemMontagem({...novoItemMontagem, categoria: e.target.value})}><option value="paes">Pães</option><option value="queijos">Queijos</option><option value="salsichas">Salsichas</option><option value="molhos">Molhos</option><option value="adicionais">Adicionais</option></select>
                        <input placeholder="Nome" className="flex-1 border border-indigo-900/40 bg-zinc-900 text-zinc-200 rounded p-2 text-xs" value={novoItemMontagem.nome} onChange={e => setNovoItemMontagem({...novoItemMontagem, nome: e.target.value})}/>
                        <input placeholder="R$ Extra" type="number" className="w-20 border border-indigo-900/40 bg-zinc-900 text-zinc-200 rounded p-2 text-xs" value={novoItemMontagem.valor} onChange={e => setNovoItemMontagem({...novoItemMontagem, valor: e.target.value})}/>
                        <button onClick={adicionarItemConfig} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold hover:bg-indigo-500">Salvar</button>
                     </div>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{key: 'paes', title: '1. Pães'},{key: 'queijos', title: '2. Queijos'},{key: 'salsichas', title: '3. Salsichas'},{key: 'molhos', title: '4. Molhos'},{key: 'adicionais', title: '5. Adicionais'}].map(grupo => (<Card key={grupo.key} className="p-4 bg-zinc-900 border-zinc-800"><h5 className="font-bold text-zinc-400 text-xs uppercase mb-2 border-b border-zinc-800 pb-1">{grupo.title}</h5><div className="space-y-1">{configMontagem[grupo.key].map(item => (<div key={item.id} className="flex justify-between text-xs bg-zinc-950 p-2 rounded text-zinc-300 border border-zinc-800"><span>{item.nome}</span><span>{item.valor > 0 ? `+${formatarMoeda(item.valor)}` : 'Grátis'} <button onClick={() => removerItemConfig(grupo.key, item.id)} className="text-red-500 ml-2 font-bold hover:text-red-400">x</button></span></div>))}</div></Card>))}</div>
               </div>
            )}
            {abaAtiva === 'config' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-zinc-100 italic flex items-center gap-2"><Settings className="text-zinc-500"/> Configurações</h2></div><Card className="p-6 border-zinc-800 bg-zinc-900"><h3 className="font-bold text-lg mb-4 text-zinc-100 flex items-center gap-2"><ImageIcon size={20}/> Logo</h3><input placeholder="URL da Logo" className="w-full border border-zinc-700 bg-zinc-950 text-zinc-200 rounded-lg p-2 text-sm" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}/></Card><Card className="p-6 border-zinc-800 bg-zinc-900"><h3 className="font-bold text-lg mb-4 text-zinc-100">Taxas de Entrega</h3><form onSubmit={salvarTaxa} className="flex gap-2 mb-6"><input placeholder="Descrição" className="flex-1 border border-zinc-700 bg-zinc-950 text-zinc-200 rounded-lg p-2 text-sm" value={novaTaxa.nome} onChange={e => setNovaTaxa({...novaTaxa, nome: e.target.value})}/><input placeholder="Valor" type="number" className="w-24 border border-zinc-700 bg-zinc-950 text-zinc-200 rounded-lg p-2 text-sm" value={novaTaxa.valor} onChange={e => setNovaTaxa({...novaTaxa, valor: e.target.value})}/><button className="bg-green-600 text-white px-4 rounded-lg font-bold hover:bg-green-500"><Plus/></button></form><div className="space-y-2">{taxasFrete.map(t => (<div key={t.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800"><span className="text-sm text-zinc-300">{t.nome}</span><div className="flex items-center gap-3"><span className="font-bold text-emerald-400">{formatarMoeda(t.valor)}</span><button onClick={() => excluirTaxa(t.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button></div></div>))}</div></Card></div>)}
        </div>

        {/* BOTTOM BAR (MOBILE) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex justify-around p-2 z-20 pb-safe">
           <button onClick={() => setAbaAtiva('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'dashboard' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}><Home size={20}/><span className="text-[10px] font-bold">Início</span></button>
           <button onClick={() => setAbaAtiva('pedidos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'pedidos' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}><ClipboardList size={20}/><span className="text-[10px] font-bold">Pedidos</span></button>
           <button onClick={abrirNovoPedido} className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full p-3 -mt-8 shadow-lg shadow-red-900/50 border-4 border-zinc-900 active:scale-95 transition-transform"><Plus size={32} strokeWidth={3}/></button>
           <button onClick={() => setAbaAtiva('vendas')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'vendas' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}><DollarSign size={20}/><span className="text-[10px] font-bold">Caixa</span></button>
           <button onClick={() => setAbaAtiva('produtos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'produtos' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}><ChefHat size={20}/><span className="text-[10px] font-bold">Menu</span></button>
        </div>
      </main>

      {/* MODAIS (DARK THEMED) */}
      {modalProdutoAberto && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-800 p-6"><h3 className="font-bold text-xl mb-4 text-white">{formProduto.id ? 'Editar Produto' : 'Novo Produto'}</h3><form onSubmit={salvarProduto} className="space-y-4"><div><label className="text-xs font-bold uppercase text-zinc-500">Nome</label><input required className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formProduto.nome} onChange={e => setFormProduto({...formProduto, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-zinc-500">Descrição</label><textarea className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 h-16" value={formProduto.descricao} onChange={e => setFormProduto({...formProduto, descricao: e.target.value})}/></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold uppercase text-zinc-500">Preço</label><input required type="number" step="0.50" className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formProduto.preco} onChange={e => setFormProduto({...formProduto, preco: e.target.value})}/></div><div className="flex-1"><label className="text-xs font-bold uppercase text-zinc-500">Estoque</label><input type="number" className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formProduto.estoque} onChange={e => setFormProduto({...formProduto, estoque: e.target.value})}/></div></div><div><label className="text-xs font-bold uppercase text-zinc-500">Categoria</label><select className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formProduto.categoria} onChange={e => setFormProduto({...formProduto, categoria: e.target.value})}><option value="Lanches">Lanches</option><option value="Bebidas">Bebidas</option><option value="Combos">Combos</option><option value="Adicionais">Adicionais</option></select></div>{formProduto.categoria !== 'Adicionais' && formProduto.categoria !== 'Bebidas' && <div><label className="text-xs font-bold uppercase text-zinc-500">Opções</label><textarea className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 h-20 text-sm" value={formProduto.opcoes} onChange={e => setFormProduto({...formProduto, opcoes: e.target.value})}/></div>}<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800"><button type="button" onClick={() => setModalProdutoAberto(false)} className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200">Salvar</button></div></form></div></div>)}
      {modalClienteAberto && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-800 p-6"><h3 className="font-bold text-xl mb-4 text-blue-400 flex items-center gap-2"><UserPlus size={24}/> {formCliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3><form onSubmit={salvarCliente} className="space-y-4"><div><label className="text-xs font-bold uppercase text-zinc-500">Nome</label><input required className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-zinc-500">Telefone</label><input className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-zinc-500">Endereço</label><input required className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2" value={formCliente.endereco} onChange={e => setFormCliente({...formCliente, endereco: e.target.value})}/></div><div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800"><button type="button" onClick={() => setModalClienteAberto(false)} className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500">Salvar</button></div></form></div></div>)}
      
      {modalMonteDogAberto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-800">
               <div className="bg-indigo-700 p-4 text-white font-black text-xl flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-2"><Edit3/> MONTE SEU DOG</div>
                   <button onClick={() => setModalMonteDogAberto(false)} className="bg-white/10 p-1 rounded hover:bg-white/20"><X/></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-6 bg-zinc-950 flex-1">
                   <div><h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-zinc-800 pb-2">1. Escolha o Pão</h4><div className="space-y-2">{configMontagem.paes.map(pao => (<label key={pao.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${montagem.paoId == pao.id ? 'border-indigo-500 bg-indigo-900/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}><input type="radio" name="pao" className="accent-indigo-500 w-5 h-5" checked={montagem.paoId == pao.id} onChange={() => setMontagem({...montagem, paoId: pao.id})}/><span className="font-bold text-zinc-200">{pao.nome} {pao.valor > 0 && <span className="text-indigo-400 text-xs ml-1">(+{formatarMoeda(pao.valor)})</span>}</span></label>))}</div></div>
                   <div><h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-zinc-800 pb-2">2. Queijo</h4><div className="grid grid-cols-2 gap-2">{configMontagem.queijos.map(item => (<label key={item.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${montagem.queijoIds.includes(item.id) ? 'bg-emerald-900/20 border-emerald-600 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}><input type="checkbox" className="accent-emerald-500" checked={montagem.queijoIds.includes(item.id)} onChange={() => toggleMultiplo('queijoIds', item.id)}/><span className="flex-1 font-medium">{item.nome}</span>{item.valor > 0 && <span className="font-bold text-emerald-500">+{item.valor}</span>}</label>))}</div></div>
                   <div><h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-zinc-800 pb-2">3. Salsicha</h4><div className="space-y-2">{configMontagem.salsichas.map(sal => (<label key={sal.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${montagem.salsichaId == sal.id ? 'border-indigo-500 bg-indigo-900/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}><input type="radio" name="salsicha" className="accent-indigo-500 w-5 h-5" checked={montagem.salsichaId == sal.id} onChange={() => setMontagem({...montagem, salsichaId: sal.id})}/><span className="font-bold text-zinc-200 text-sm">{sal.nome} {sal.valor > 0 && <span className="text-indigo-400 text-xs">(+{formatarMoeda(sal.valor)})</span>}</span></label>))}</div></div>
                   <div><h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-zinc-800 pb-2">4. Molhos</h4><div className="flex flex-wrap gap-2">{configMontagem.molhos.map(item => (<label key={item.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold ${montagem.molhoIds.includes(item.id) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><input type="checkbox" className="hidden" checked={montagem.molhoIds.includes(item.id)} onChange={() => toggleMultiplo('molhoIds', item.id)}/>{item.nome}</label>))}</div></div>
                   <div><h4 className="font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-zinc-800 pb-2">5. Extras</h4><div className="space-y-2">{configMontagem.adicionais.map(extra => (<label key={extra.id} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${montagem.adicionalIds.includes(extra.id) ? 'border-yellow-500 bg-yellow-900/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}><div className="flex items-center gap-2"><input type="checkbox" className="accent-yellow-500 w-5 h-5" checked={montagem.adicionalIds.includes(extra.id)} onChange={() => toggleMultiplo('adicionalIds', extra.id)}/><span className={`font-bold text-sm ${montagem.adicionalIds.includes(extra.id) ? 'text-yellow-200' : 'text-zinc-400'}`}>{extra.nome}</span></div><span className="font-bold text-sm text-yellow-500">+ {formatarMoeda(extra.valor)}</span></label>))}</div></div>
               </div>
               <div className="p-4 bg-zinc-900 border-t border-zinc-800"><button onClick={concluirMontagem} className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform border border-indigo-500/50">ADICIONAR AO PEDIDO</button></div>
           </div>
        </div>
      )}

      {modalPedidoAberto && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"><div className="bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-zinc-800"><div className="bg-gradient-to-r from-red-700 to-orange-700 text-white p-5 flex justify-between items-center"><h3 className="font-extrabold text-xl flex items-center gap-2 italic">{formPedido.id ? 'Editar Dogão' : 'Novo Pedido'}</h3><button onClick={() => setModalPedidoAberto(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-zinc-950"><form onSubmit={salvarPedido} className="space-y-6"><Card className="p-5 border-red-900/30 bg-red-950/10"><h4 className="font-bold text-red-400 mb-4 flex items-center gap-2 text-lg"><User size={20} className="text-red-500"/> Cliente</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{!formPedido.id && (<div className="md:col-span-2 bg-red-900/20 p-3 rounded-xl border border-red-900/50"><label className="text-xs font-bold text-red-300 uppercase mb-1 block">Buscar Salvo</label><select className="w-full border border-red-900 bg-zinc-900 text-white rounded-lg p-2.5" onChange={(e) => selecionarClienteNoPedido(e.target.value)} defaultValue=""><option value="">-- Selecione --</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>)}<div><label className="text-xs font-bold text-zinc-400 uppercase">Nome</label><input required className="w-full border border-zinc-700 bg-zinc-900 text-white rounded-lg p-2.5 focus:border-red-500" value={formPedido.nome} onChange={e => setFormPedido({...formPedido, nome: e.target.value})}/></div><div><label className="text-xs font-bold text-zinc-400 uppercase">Telefone</label><input className="w-full border border-zinc-700 bg-zinc-900 text-white rounded-lg p-2.5 focus:border-red-500" value={formPedido.telefone} onChange={e => setFormPedido({...formPedido, telefone: e.target.value})}/></div><div className="md:col-span-2"><label className="text-xs font-bold text-zinc-400 uppercase">Endereço</label><input required className="w-full border border-zinc-700 bg-zinc-900 text-white rounded-lg p-2.5 focus:border-red-500" value={formPedido.endereco} onChange={e => setFormPedido({...formPedido, endereco: e.target.value})}/></div></div></Card><Card className="p-5 border-yellow-900/30 bg-yellow-950/10"><h4 className="font-bold text-yellow-500 mb-4 flex items-center gap-2 text-lg"><Utensils size={20}/> Itens</h4><div className="space-y-3">{formPedido.itens.map((item, idx) => { const prodAtual = produtos.find(p => p.id == item.produtoId); const ehBebida = prodAtual?.categoria === 'Bebidas'; const ehAdicional = prodAtual?.categoria === 'Adicionais'; const ehCustom = item.produtoId === 999; 
                         const opcoesPossiveis = prodAtual?.opcoes ? prodAtual.opcoes.split(',') : [];
                         return (<div key={idx} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-sm relative"><div className="flex gap-2 items-start mb-3"><div className="w-20"><label className="text-[10px] uppercase font-bold text-zinc-500">Qtd</label><input type="number" min="1" className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 text-center font-black text-lg" value={item.qtd} onChange={e => atualizarItem(idx, 'qtd', e.target.value)}/></div><div className="flex-1"><label className="text-[10px] uppercase font-bold text-zinc-500">Produto</label>{ehCustom ? <div className="w-full border border-indigo-900 bg-indigo-900/20 rounded-lg p-2.5 font-bold text-indigo-300">{item.nome} (R$ {item.preco})</div> : <select required className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2.5 font-bold" value={item.produtoId} onChange={e => atualizarItem(idx, 'produtoId', e.target.value)}><option value="">Selecione...</option>{Object.keys(produtos.reduce((acc, p) => {if(p.tipo!=='adicional' && p.id!==999) acc[p.categoria]=true; return acc},{})).map(cat => <optgroup key={cat} label={cat}>{produtos.filter(p => p.categoria === cat && p.tipo !== 'adicional' && p.id !== 999).map(p => <option key={p.id} value={p.id}>{p.categoria === 'Lanches' ? '🍔' : p.categoria === 'Bebidas' ? '🥤' : '🍱'} {p.nome}</option>)}</optgroup>)}</select>}</div></div>{item.produtoId && !ehCustom && (<div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 mt-2 space-y-3">{opcoesPossiveis.length > 0 && (<div><label className="text-xs font-bold text-amber-500 uppercase block mb-1">Opções (Selecione)</label><div className="flex flex-wrap gap-2">{opcoesPossiveis.map(op => { const opClean = op.trim(); const selecionado = (item.opcoesSelecionadas || []).includes(opClean); return (<button type="button" key={opClean} onClick={() => toggleOpcaoItem(idx, opClean)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold ${selecionado ? 'bg-orange-600 text-white border-orange-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{extrairNomeOpcao(opClean)} {extrairValorOpcao(opClean) > 0 ? `(+${formatarMoeda(extrairValorOpcao(opClean))})` : ''}</button>)})}</div></div>)}{!ehBebida && !ehAdicional && (<div><label className="text-xs font-bold text-amber-500 uppercase block mb-1">Adicionais</label><div className="flex flex-wrap gap-2">{produtos.filter(p => p.tipo === 'adicional').map(ad => (<button type="button" key={ad.id} onClick={() => toggleAdicionalItem(idx, ad.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold ${item.listaAdicionais?.includes(ad.id) ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>{ad.nome} (+R$ {ad.preco})</button>))}</div></div>)}</div>)}{ehCustom && <div className="text-xs text-zinc-400 mt-2 bg-zinc-950 p-2 rounded border border-zinc-800 whitespace-pre-line">{item.opcaoSelecionada}</div>}{formPedido.itens.length > 1 && <button type="button" onClick={() => {const ni = formPedido.itens.filter((_, i) => i !== idx); setFormPedido({...formPedido, itens: ni})}} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>}</div>)})} <button type="button" onClick={() => setFormPedido({...formPedido, itens: [...formPedido.itens, { produtoId: '', nome: '', qtd: 1, preco: 0, opcaoSelecionada: '', listaAdicionais: [] }]})} className="w-full py-3 bg-zinc-900 border-2 border-dashed border-zinc-700 text-zinc-400 font-bold rounded-xl hover:bg-zinc-800 hover:text-white flex justify-center items-center gap-2"><Plus size={18}/> ADICIONAR ITEM PADRÃO</button></div></Card><Card className="p-5 border-green-900/30 bg-green-950/10"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800"><label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Taxa Entrega</label><div className="flex gap-1"><select className="flex-1 border border-zinc-700 bg-zinc-950 text-white rounded-md py-1 px-2 text-sm" onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})} value={taxasFrete.some(t => t.valor == formPedido.taxaEntrega) ? formPedido.taxaEntrega : ''}><option value="0">Balcão</option>{taxasFrete.map(t => <option key={t.id} value={t.valor}>{t.nome}</option>)}<option value="">Outro</option></select><input type="number" className="w-16 border border-zinc-700 bg-zinc-950 text-white rounded-md py-1 px-1 text-sm font-bold text-right" value={formPedido.taxaEntrega} onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})}/></div></div><div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800"><label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Pagamento</label><select className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-md py-1 px-2 text-sm font-bold" value={formPedido.pagamento} onChange={e => setFormPedido({...formPedido, pagamento: e.target.value})}><option value="Dinheiro">💵 Dinheiro</option><option value="PIX">✨ PIX</option><option value="Cartão">💳 Cartão</option></select></div></div>{formPedido.pagamento === 'Dinheiro' && (<div className="mb-4 bg-green-900/30 p-3 rounded-xl border border-green-800 flex items-center justify-between"><label className="text-xs font-bold text-green-400">Troco para:</label><input type="number" className="w-20 border-b-2 border-green-600 p-1 font-black text-sm text-green-400 bg-transparent focus:outline-none" placeholder="0,00" value={formPedido.trocoPara} onChange={e => setFormPedido({...formPedido, trocoPara: e.target.value})}/></div>)}<div className="mb-4"><label className="text-xs font-bold text-zinc-400 uppercase ml-1 mb-1 flex items-center gap-1"><Percent size={12}/> Desconto (%)</label><input type="number" className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2.5 font-bold" placeholder="0" value={formPedido.desconto} onChange={e => setFormPedido({...formPedido, desconto: e.target.value})}/></div><div><label className="text-xs font-bold text-zinc-400 uppercase ml-1 mb-1 block">Obs. Gerais</label><textarea className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-xl p-3 h-16 text-sm" value={formPedido.observacoes} onChange={e => setFormPedido({...formPedido, observacoes: e.target.value})}/></div></Card></form></div><div className="p-5 bg-zinc-900 border-t-2 border-zinc-800 flex justify-between items-center"><div><span className="text-xs font-bold text-zinc-500 uppercase">Total</span><div className="text-3xl font-black text-white">{formatarMoeda(calcularTotalPedido(formPedido.itens, formPedido.taxaEntrega, formPedido.desconto))}</div></div><button onClick={salvarPedido} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black py-4 px-10 rounded-full shadow-lg transition-all text-lg flex items-center gap-2">{formPedido.id ? 'SALVAR' : 'LANÇAR'}</button></div></div></div>)}
    </div>
  );
}

export default App;