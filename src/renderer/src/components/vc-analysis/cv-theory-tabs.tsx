import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export const CVTheoryTabs: React.FC = () => {
  return (
    <Tabs defaultValue="randles" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="randles">Randles-Sevcik</TabsTrigger>
        <TabsTrigger value="linear">Linear</TabsTrigger>
        <TabsTrigger value="powerlaw">Power Law</TabsTrigger>
        <TabsTrigger value="kinetics">Kinetics</TabsTrigger>
      </TabsList>

      {/* Randles-Sevcik */}
      <TabsContent value="randles" className="space-y-4">
        <div className="bg-accent/10 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-base">Randles-Sevcik Equation (Diffusion Control)</h3>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Fundamental Equation:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              Ip = 0.4463 × n × F × A × C × √(nFvD/RT)
            </div>
            <p className="text-xs text-muted-foreground">
              Where: n = electrons, F = Faraday constant, A = electrode area, C = concentration, v =
              scan rate, D = diffusion coefficient, R = gas constant, T = temperature
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Rearranged for √v dependency:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              Ip = k × √v
            </div>
            <p className="text-xs text-muted-foreground">
              Where k = 0.4463 × n × F × A × C × √(nFD/RT) is a constant
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">What We Plot:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>
                <strong>X-axis:</strong> √(Scan Rate) [√(V/s)]
              </li>
              <li>
                <strong>Y-axis:</strong> Peak Current [A]
              </li>
              <li>
                <strong>Expected:</strong> Linear relationship with slope = k
              </li>
              <li>
                <strong>Indicates:</strong> Diffusion-controlled electrochemical process
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Physical Meaning:
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              The √v relationship comes from the diffusion layer thickness decreasing with faster
              scan rates. Faster scans = thinner diffusion layer = higher current. This is the
              hallmark of a reversible, diffusion-limited electrochemical reaction.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Linear */}
      <TabsContent value="linear" className="space-y-4">
        <div className="bg-accent/10 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-base">Linear Relationship (Adsorption/Kinetic)</h3>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">General Linear Equation:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              Ip = m × v + b
            </div>
            <p className="text-xs text-muted-foreground">
              Where: m = slope, b = intercept, v = scan rate
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">For Adsorbed Species:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              Ip = n × F × A × Γ × v / (4RT)
            </div>
            <p className="text-xs text-muted-foreground">
              Where: Γ = surface coverage (mol/cm²), other symbols as before
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">What We Plot:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>
                <strong>X-axis:</strong> Scan Rate [V/s]
              </li>
              <li>
                <strong>Y-axis:</strong> Peak Current [A]
              </li>
              <li>
                <strong>Expected:</strong> Linear relationship
              </li>
              <li>
                <strong>Indicates:</strong> Adsorbed species or kinetic control
              </li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded space-y-2 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              Physical Meaning:
            </p>
            <p className="text-xs text-green-800 dark:text-green-200">
              Linear dependence on v (not √v) indicates the electroactive species is already on the
              electrode surface (adsorbed). The current increases linearly because the amount of
              charge transferred per cycle is proportional to scan rate, not limited by diffusion.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Power Law */}
      <TabsContent value="powerlaw" className="space-y-4">
        <div className="bg-accent/10 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-base">Power Law Analysis: log(Ip) vs log(v)</h3>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Power Law Form:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              Ip = k × v^α
            </div>
            <p className="text-xs text-muted-foreground">
              Where: k = constant, v = scan rate, α = exponent (0 to 1)
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Taking Natural Logarithm:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              ln(Ip) = ln(k) + α × ln(v)
            </div>
            <p className="text-xs text-muted-foreground">This is a linear equation: y = b + m×x</p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Interpretation of Slope (α):</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>
                <strong>α ≈ 0.5:</strong> Diffusion-controlled (Randles-Sevcik)
              </li>
              <li>
                <strong>α ≈ 1.0:</strong> Adsorption-controlled or kinetic
              </li>
              <li>
                <strong>α between 0.5-1.0:</strong> Mixed control (diffusion + kinetic)
              </li>
            </ul>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">What We Plot:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>
                <strong>X-axis:</strong> ln(Scan Rate)
              </li>
              <li>
                <strong>Y-axis:</strong> ln(Peak Current)
              </li>
              <li>
                <strong>Slope:</strong> Exponent α (mechanism indicator)
              </li>
              <li>
                <strong>Intercept:</strong> ln(k)
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded space-y-2 border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              Physical Meaning:
            </p>
            <p className="text-xs text-purple-800 dark:text-purple-200">
              This is a diagnostic tool. The slope tells us the mechanism: diffusion (0.5),
              adsorption (1.0), or mixed. It&apos;s more robust than looking at individual plots
              because it captures the overall scan rate dependence.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Kinetics */}
      <TabsContent value="kinetics" className="space-y-4">
        <div className="bg-accent/10 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-base">Electrochemical Kinetics: ΔEp vs ln(v)</h3>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">Peak Separation Definition:</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              ΔEp = Ep,a - Ep,c
            </div>
            <p className="text-xs text-muted-foreground">
              Where: Ep,a = anodic peak potential, Ep,c = cathodic peak potential
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">For Reversible System (Nernst):</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              ΔEp = 59/n mV (at 25°C, independent of v)
            </div>
            <p className="text-xs text-muted-foreground">
              Where: n = number of electrons transferred
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">For Irreversible/Quasi-reversible (Laviron):</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono text-xs overflow-x-auto">
              ΔEp = (2.303RT)/(αnF) × ln(v) + const
            </div>
            <p className="text-xs text-muted-foreground">
              Where: α = transfer coefficient, other symbols as before
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded space-y-2">
            <p className="text-sm font-semibold">What We Plot:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>
                <strong>X-axis:</strong> ln(Scan Rate)
              </li>
              <li>
                <strong>Y-axis:</strong> ΔEp [V]
              </li>
              <li>
                <strong>Slope:</strong> Indicates electron transfer kinetics
              </li>
              <li>
                <strong>Flat line:</strong> Reversible system (ΔEp ≈ 59/n mV)
              </li>
              <li>
                <strong>Increasing line:</strong> Irreversible/slow kinetics
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded space-y-2 border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              Physical Meaning:
            </p>
            <p className="text-xs text-orange-800 dark:text-orange-200">
              ΔEp reveals electron transfer kinetics. Reversible systems show constant ΔEp
              regardless of scan rate. Irreversible systems show ΔEp increasing with scan rate
              because the electron transfer becomes slower relative to the scan rate, causing peaks
              to separate more.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default CVTheoryTabs
