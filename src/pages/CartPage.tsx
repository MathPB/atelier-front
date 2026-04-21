import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useItemStocks } from '@/hooks/useItemStock';
import type { CartItem } from '@/stores/cartStore';

function CartItemRow({
  item,
  updateQuantity,
  removeItem,
}: {
  item: CartItem;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}) {
  const { data: stocks, isLoading } = useItemStocks(item.id);

  let availableStock = 0;
  if (item.selectedSizeId) {
    const specificStock = stocks?.find(s => s.sizeId === item.selectedSizeId);
    availableStock = specificStock?.available ? Number(specificStock.quantity) : 0;
  } else {
    const totalStock = stocks?.reduce((acc, stock) => acc + (stock.available ? Number(stock.quantity) : 0), 0) ?? 0;
    availableStock = totalStock > 0 ? totalStock : 1;
  }

  const canAddMore = !isLoading && stocks && item.quantity < availableStock;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 py-2.5 md:py-3 items-center gap-4 md:gap-0">
      <div className="col-span-8 flex gap-4 md:gap-6 items-center min-w-0">
        <div className="relative overflow-hidden bg-slate-50 w-16 md:w-20 h-22 md:h-28 shrink-0 border border-slate-100">
          {item.images?.[0] ? (
            <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200"><ShoppingBag size={24} /></div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 pr-4">
          <h3 className="text-xs md:text-sm font-medium text-slate-800 uppercase leading-snug font-sans tracking-widest line-clamp-2">
            {item.name}
          </h3>
          <div className="space-y-0.5 mt-1">
            {item.color && (
              <p className="text-[9px] text-slate-400 font-sans uppercase tracking-[0.1em]">Cor: <span className="text-slate-600 ml-1">{item.color}</span></p>
            )}
            <p className="text-[9px] text-slate-400 font-sans uppercase tracking-[0.1em]">Ref: <span className="text-slate-600 ml-1 font-mono">{item.id.slice(0, 6)}</span></p>
            {item.selectedSizeName && (
              <p className="text-[9px] text-slate-400 font-sans uppercase tracking-[0.1em]">Tamanho: <span className="text-slate-600 ml-1">{item.selectedSizeName}</span></p>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-2 flex justify-start md:justify-center">
        <div className="flex items-center border border-slate-200 bg-white">
          <button
            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
            className="px-2 py-1 text-slate-400 hover:bg-slate-50 border-r border-slate-200 font-sans text-xs"
          >
            −
          </button>
          <span className="px-3 py-1 text-[10px] font-sans font-bold text-slate-900 w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => canAddMore && updateQuantity(item.cartItemId, item.quantity + 1)}
            disabled={!canAddMore}
            className={`px-2 py-1 font-sans text-xs border-l border-slate-200 ${canAddMore ? 'text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer' : 'text-slate-200 bg-slate-50 cursor-not-allowed'}`}
          >
            +
          </button>
        </div>
      </div>

      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => removeItem(item.cartItemId)}
          className="text-red-500 hover:text-red-700 pl-2 py-2 pr-0 transition-colors"
          title="Remover Item"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clear } = useCartStore();
  const navigate = useNavigate();

  function handleConfirmOrder() {
    if (items.length === 0) return;
    navigate('/pedido-sucesso', { state: { items } });
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-serif text-slate-900 selection:bg-emerald-100 flex flex-col">
      <main className="flex-grow max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-6 gap-2">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-slate-800 uppercase">Meu Carrinho</h2>
          <p className="text-slate-400 font-sans text-xs uppercase tracking-widest">{items.length} peças no total</p>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center border-t border-slate-100">
            <p className="text-slate-400 mb-8 font-sans">Seu carrinho está vazio.</p>
            <Link
              to="/"
              className="px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#222222]"
            >
              Conheça a loja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Lista de Produtos */}
            <div className="flex-grow">
              <div className="hidden md:grid grid-cols-12 w-full text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300 py-6 items-center border-b border-slate-100">
                <div className="col-span-8">Produto</div>
                <div className="col-span-2 text-center">Quantidade</div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={clear}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-400 hover:text-rose-600 transition-all font-sans whitespace-nowrap pl-6"
                  >
                    Limpar Carrinho*
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {items.map((item) => (
                  <CartItemRow
                    key={item.cartItemId}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))}
              </div>
            </div>

            {/* Resumo */}
            <aside className="w-full lg:w-[460px]">
              <div className="bg-slate-50/50 p-6 md:p-10 border border-slate-100 rounded-sm">
                <h3 className="text-xl font-light mb-8 tracking-[0.2em] uppercase text-slate-800 border-b border-slate-100 pb-4">
                  Resumo
                </h3>

                <p className="text-[11px] text-slate-400 font-sans uppercase tracking-widest mb-8 leading-relaxed">
                  O valor do aluguel será combinado diretamente com a equipe Bete Atelier.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmOrder}
                    className="w-full bg-black text-white py-5 text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-[#222222] transition-all flex items-center justify-center gap-4"
                  >
                    Confirmar Pedido
                  </button>
                  <Link
                    to="/"
                    className="w-full bg-transparent text-black border border-black/20 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    Voltar para a Loja
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 border-t border-slate-100 uppercase">
        <div className="text-center">
          <p className="text-[9px] text-slate-300 tracking-[0.3em] font-medium font-sans">
            © 2024 Bete Atelier · Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
