import { motion } from 'framer-motion';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl items-stretch gap-0 px-5 py-10 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-l-3xl lg:block">
        <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/30 to-transparent" />
        <p className="absolute bottom-8 left-8 right-8 font-display text-3xl font-semibold text-white">Your room is held the moment you confirm.</p>
      </div>
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col justify-center rounded-3xl bg-white p-8 shadow-lift sm:p-12 lg:rounded-l-none">
        <h1 className="text-4xl font-semibold text-ocean">{title}</h1>
        <p className="mt-2 text-ink/60">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-sm text-ink/60">{footer}</div>
      </motion.div>
    </div>
  );
}
