import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  BadgeDollarSign,
  ChevronDown,
  CircleHelp,
  Megaphone,
  Package,
  ReceiptText,
  RotateCcw,
  Store,
  Truck,
  TrendingUp,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type CalculatorValues = {
  price: string;
  productCost: string;
  shipping: string;
  fees: string;
  advertising: string;
  tax: string;
  quantity: string;
};

const DEFAULTS: CalculatorValues = {
  price: '39.95',
  productCost: '12.50',
  shipping: '4.25',
  fees: '12',
  advertising: '3.50',
  tax: '7.25',
  quantity: '24',
};

const toNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const percent = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  icon: Icon,
  step = '0.01',
}: {
  id: keyof CalculatorValues;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  icon: typeof Package;
  step?: string;
}) {
  return (
    <label className="group block" htmlFor={id}>
      <span className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] font-bold tracking-[-0.01em] text-[hsl(var(--foreground))]">
          <Icon className="h-4 w-4 text-[hsl(var(--primary))]" strokeWidth={2.2} />
          {label}
        </span>
        <span className="hidden text-[11px] font-medium text-[hsl(var(--muted-foreground))] sm:block">
          {hint}
        </span>
      </span>
      <span className="input-shell flex h-12 items-center overflow-hidden rounded-[13px] border border-[hsl(var(--input))] bg-[hsl(var(--card))] shadow-[0_2px_0_hsl(var(--foreground)/0.025)]">
        {prefix ? (
          <span className="pl-3.5 text-sm font-bold text-[hsl(var(--muted-foreground))]">{prefix}</span>
        ) : null}
        <input
          id={id}
          data-testid={`input-${id}`}
          type="number"
          min="0"
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] font-semibold tracking-[-0.01em] text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          aria-label={label}
        />
        {suffix ? (
          <span className="pr-3.5 text-[12px] font-bold text-[hsl(var(--muted-foreground))]">{suffix}</span>
        ) : null}
      </span>
    </label>
  );
}

function CostLine({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-[13px] font-semibold text-[hsl(var(--foreground)/0.8)]">{label}</span>
        {detail ? <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{detail}</span> : null}
      </div>
      <span className="font-mono-ui shrink-0 text-[13px] font-medium text-[hsl(var(--foreground))]">{money(value)}</span>
    </div>
  );
}

function Home() {
  const [values, setValues] = useState<CalculatorValues>(DEFAULTS);
  const [showMethod, setShowMethod] = useState(false);

  const result = useMemo(() => {
    const price = toNumber(values.price);
    const productCost = toNumber(values.productCost);
    const shipping = toNumber(values.shipping);
    const fees = price * (toNumber(values.fees) / 100);
    const advertising = toNumber(values.advertising);
    const tax = price * (toNumber(values.tax) / 100);
    const quantity = Math.max(1, Math.floor(toNumber(values.quantity)));
    const totalCosts = productCost + shipping + fees + advertising + tax;
    const profit = price - totalCosts;
    const margin = price > 0 ? profit / price : 0;
    const variableRate = toNumber(values.fees) / 100 + toNumber(values.tax) / 100;
    const breakEven = variableRate < 1 ? (productCost + shipping + advertising) / (1 - variableRate) : 0;
    return {
      price,
      productCost,
      shipping,
      fees,
      advertising,
      tax,
      quantity,
      totalCosts,
      profit,
      margin,
      breakEven,
      totalProfit: profit * quantity,
    };
  }, [values]);

  const update = (key: keyof CalculatorValues) => (nextValue: string) => {
    setValues((current) => ({ ...current, [key]: nextValue }));
  };

  const reset = () => {
    setValues({ ...DEFAULTS });
    setShowMethod(false);
  };

  const isPositive = result.profit >= 0;

  return (
    <div className="app-shell min-h-[100dvh] text-[hsl(var(--foreground))]">
      <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-end gap-[3px] overflow-hidden rounded-[11px] bg-[hsl(var(--primary))] p-2 shadow-[0_5px_15px_hsl(var(--primary)/0.18)]" aria-hidden="true">
            <span className="h-2.5 w-[3px] rounded-full bg-[hsl(var(--primary-foreground)/0.5)]" />
            <span className="h-4 w-[3px] rounded-full bg-[hsl(var(--primary-foreground)/0.72)]" />
            <span className="h-5.5 w-[3px] rounded-full bg-[hsl(var(--primary-foreground))]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.04em]">Marginwise</p>
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">US profit calculator</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="button-reset"
          onClick={reset}
          className="group flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] px-3.5 py-2 text-[12px] font-bold text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/0.45)] hover:bg-[hsl(var(--card))] hover:text-[hsl(var(--primary))] active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-45" />
          Reset calculator
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-5 pb-10 pt-7 sm:px-8 sm:pt-12 lg:px-10 lg:pt-16">
        <section className="mb-10 max-w-[760px] reveal">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-7 bg-[hsl(var(--accent))]" />
            <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--accent-foreground)/0.72)]">Know your number</span>
          </div>
          <h1 className="max-w-[730px] text-balance text-[clamp(2.35rem,6vw,4.7rem)] font-extrabold leading-[0.98] tracking-[-0.075em] text-[hsl(var(--foreground))]">
            What does each sale <span className="text-[hsl(var(--primary))]">really</span> leave behind?
          </h1>
          <p className="mt-5 max-w-[570px] text-[15px] leading-7 text-[hsl(var(--muted-foreground))] sm:text-[16px]">
            Plug in the costs that follow your product from shelf to doorstep. Get the clean, after-everything number in seconds.
          </p>
        </section>

        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.03fr)_minmax(420px,0.97fr)] lg:gap-7">
          <div className="reveal reveal-delay-1 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.82)] p-5 shadow-[0_18px_50px_hsl(222_39%_17%/0.045)] backdrop-blur-sm sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-5">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--primary))]">01 / Inputs</span>
                  <span className="rounded-full bg-[hsl(var(--primary)/0.1)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[hsl(var(--primary))]">USD</span>
                </div>
                <h2 className="text-[21px] font-extrabold tracking-[-0.045em]">Your product economics</h2>
                <p className="mt-1 text-[12px] leading-5 text-[hsl(var(--muted-foreground))]">All amounts are per unit unless noted.</p>
              </div>
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] sm:flex">
                <ReceiptText className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField id="price" label="Selling price" hint="Revenue" value={values.price} onChange={update('price')} prefix="$" icon={BadgeDollarSign} />
              <NumberField id="productCost" label="Product cost" hint="COGS" value={values.productCost} onChange={update('productCost')} prefix="$" icon={Package} />
              <NumberField id="shipping" label="Shipping & fulfillment" hint="Per unit" value={values.shipping} onChange={update('shipping')} prefix="$" icon={Truck} />
              <NumberField id="fees" label="Marketplace fees" hint="Of selling price" value={values.fees} onChange={update('fees')} suffix="%" icon={Store} />
              <NumberField id="advertising" label="Advertising cost" hint="Per unit" value={values.advertising} onChange={update('advertising')} prefix="$" icon={Megaphone} />
              <NumberField id="tax" label="Sales tax" hint="Of selling price" value={values.tax} onChange={update('tax')} suffix="%" icon={ReceiptText} />
            </div>

            <div className="mt-5 border-t border-[hsl(var(--border))] pt-5">
              <NumberField id="quantity" label="Quantity sold" hint="For total profit" value={values.quantity} onChange={update('quantity')} icon={TrendingUp} step="1" />
            </div>
          </div>

          <div className="reveal reveal-delay-2 overflow-hidden rounded-[22px] bg-[hsl(var(--foreground))] text-[hsl(var(--card))] shadow-[0_22px_60px_hsl(222_39%_17%/0.18)]">
            <div className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[25px] border-[hsl(var(--primary)/0.14)]" />
              <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full border border-[hsl(var(--accent)/0.34)]" />
              <div className="relative">
                <div className="mb-10 flex items-center justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_0_4px_hsl(var(--accent)/0.16)]" />
                      <span className="font-mono-ui text-[10px] uppercase tracking-[0.19em] text-[hsl(var(--card)/0.58)]">02 / Your take-home</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[hsl(var(--card)/0.65)]">Profit per unit</p>
                  </div>
                  <div className="rounded-full border border-[hsl(var(--card)/0.14)] px-3 py-1.5 font-mono-ui text-[10px] text-[hsl(var(--card)/0.6)]">
                    LIVE
                  </div>
                </div>
                <div data-testid="text-profit-per-unit" className={`font-mono-ui text-[clamp(2.6rem,6vw,4.7rem)] font-medium leading-none tracking-[-0.08em] ${isPositive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--accent))]'}`}>
                  {money(result.profit)}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[hsl(var(--card)/0.13)] pb-7">
                  <span className="flex items-center gap-2 text-[12px] text-[hsl(var(--card)/0.65)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${isPositive ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent))]'}`} />
                    {isPositive ? 'You keep this after costs' : 'Costs are above revenue'}
                  </span>
                  <span className="font-mono-ui text-[12px] font-medium text-[hsl(var(--card)/0.9)]">{percent(result.margin)} margin</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6">
                  <div className="rounded-2xl bg-[hsl(var(--card)/0.08)] p-4 transition hover:bg-[hsl(var(--card)/0.12)]">
                    <p className="mb-2 text-[11px] text-[hsl(var(--card)/0.55)]">Total profit</p>
                    <p data-testid="text-total-profit" className="font-mono-ui text-[20px] font-medium tracking-[-0.06em]">{money(result.totalProfit)}</p>
                    <p className="mt-1 text-[10px] text-[hsl(var(--card)/0.45)]">{result.quantity} units</p>
                  </div>
                  <div className="rounded-2xl bg-[hsl(var(--card)/0.08)] p-4 transition hover:bg-[hsl(var(--card)/0.12)]">
                    <p className="mb-2 text-[11px] text-[hsl(var(--card)/0.55)]">Break-even price</p>
                    <p data-testid="text-break-even" className="font-mono-ui text-[20px] font-medium tracking-[-0.06em]">{money(result.breakEven)}</p>
                    <p className="mt-1 text-[10px] text-[hsl(var(--card)/0.45)]">minimum to charge</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--card)/0.06)] px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-[hsl(var(--card)/0.86)]">Cost breakdown</h3>
                <span className="font-mono-ui text-[11px] text-[hsl(var(--card)/0.48)]">per unit</span>
              </div>
              <div className="space-y-0.5">
                <CostLine label="Product cost" value={result.productCost} color="hsl(195 42% 55%)" />
                <CostLine label="Shipping & fulfillment" value={result.shipping} color="hsl(41 78% 59%)" />
                <CostLine label="Marketplace fees" value={result.fees} color="hsl(12 76% 59%)" detail={`${toNumber(values.fees)}%`} />
                <CostLine label="Advertising" value={result.advertising} color="hsl(174 46% 42%)" />
                <CostLine label="Sales tax" value={result.tax} color="hsl(40 42% 82%)" detail={`${toNumber(values.tax)}%`} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[hsl(var(--card)/0.14)] pt-4">
                <span className="text-[12px] font-bold text-[hsl(var(--card)/0.6)]">Total costs</span>
                <span data-testid="text-total-costs" className="font-mono-ui text-[14px] font-medium">{money(result.totalCosts)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal reveal-delay-3 mt-5 grid gap-5 md:grid-cols-[1fr_1.35fr]">
          <div className="rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.58)] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="donut flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-[7px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--card))]">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
              </div>
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Margin check</p>
                <p data-testid="text-margin-check" className="mt-1 text-[17px] font-extrabold tracking-[-0.04em]">
                  {result.margin >= 0.3 ? 'Healthy room to grow.' : result.margin >= 0.15 ? 'A workable margin.' : 'Worth another look.'}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[hsl(var(--muted-foreground))]">
                  At {percent(result.margin)}, every pricing decision matters.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.44)] p-5 sm:p-6">
            <button
              type="button"
              data-testid="button-toggle-method"
              onClick={() => setShowMethod((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={showMethod}
            >
              <span className="flex items-center gap-2.5 text-[13px] font-extrabold tracking-[-0.02em]">
                <CircleHelp className="h-4 w-4 text-[hsl(var(--primary))]" />
                How Marginwise calculates it
              </span>
              <ChevronDown className={`h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${showMethod ? 'rotate-180' : ''}`} />
            </button>
            {showMethod ? (
              <p className="mt-4 max-w-[640px] border-t border-[hsl(var(--border))] pt-4 text-[12px] leading-6 text-[hsl(var(--muted-foreground))]">
                Profit is your selling price minus product cost, shipping, advertising, marketplace fees, and sales tax. Percentage-based costs are applied to the selling price. Break-even is the price where profit reaches zero.
              </p>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                <span>Percentage fees are applied to your selling price.</span>
                <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-[hsl(var(--border))] pt-5 text-[11px] text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between">
          <p>Built for the people behind the product.</p>
          <p className="font-mono-ui uppercase tracking-[0.12em]">USD · estimates, not tax advice</p>
        </footer>
      </main>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
