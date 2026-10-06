/**
 * `lab.html?kit=1`: every KPI primitive on one page, in the current theme, to judge them side
 * by side without a whole screen around them.
 */
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DayTrack } from '@/components/kpi/DayTrack'
import { Delta, Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Spark } from '@/components/kpi/Spark'
import { Steps } from '@/components/kpi/Steps'
import { Ticks, type TickState } from '@/components/kpi/Ticks'

const H = 3_600_000

export function KitGallery() {
  const now = new Date()
  const days: TickState[] = [
    'full',
    'full',
    'partial',
    'full',
    'none',
    'full',
    'missed',
    'full',
    'full',
    'full',
    'rest',
    'full',
    'full',
    'full',
  ]
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-6">
      <h1 className="text-[32px] font-bold">Kit</h1>
      <Card>
        <span className="spec">Próximas 24 h</span>
        <DayTrack
          className="mt-2"
          now={now}
          items={[
            { at: new Date(now.getTime() - 3 * H), color: 'var(--sub-violet)', state: 'done' },
            { at: new Date(now.getTime() + 4.5 * H), color: 'var(--sub-violet)', state: 'next' },
            { at: new Date(now.getTime() + 12.5 * H), color: 'var(--sub-mint)', state: 'later' },
            { at: new Date(now.getTime() + 12.6 * H), color: 'var(--sub-sky)', state: 'later' },
          ]}
        />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Kpi label="Racha" value="8" unit="días" caption="con todas las tomas">
            <Ticks cells={days} />
          </Kpi>
        </Card>
        <Card>
          <Kpi
            label="Adherencia 28 d"
            value="96"
            unit="%"
            aside={<Delta text="+4" direction="up" tone="good" />}
            caption="25 de 26 tomas"
          >
            <Meter value={96} max={100} target={90} />
          </Kpi>
        </Card>
        <Card>
          <Kpi label="Ciclo" value="4" unit="/ 12 sem" caption="Sube el lun 5">
            <Steps
              height={18}
              steps={Array.from({ length: 12 }, (_, i) => ({
                level: 0.4 + Math.min(i, 6) * 0.1,
                kind: i < 3 ? 'done' : i === 3 ? 'current' : i > 9 ? 'rest' : 'planned',
              }))}
            />
          </Kpi>
        </Card>
        <Card>
          <Kpi label="Stock" value="15" unit="días" tone="warn" caption="Pide antes del 12 oct">
            <Meter value={15} max={60} target={21} color="var(--warn)" />
          </Kpi>
        </Card>
      </div>
      <Card>
        <Kpi
          label="Peso"
          value="77,0"
          unit="kg"
          size="lg"
          aside={<Delta text="0,5 kg" direction="down" tone="good" />}
          caption="−0,6 kg/sem · 9 % del camino a 72,0 kg"
        >
          <Spark values={[77.5, 77.6, 77.3, 77.4, 77.1, 77.0]} />
        </Kpi>
      </Card>
      <Card>
        <Kpi
          label="Nivel estimado"
          value="87"
          unit="% del estable"
          caption="Retatrutida · 1,2 mg a bordo"
        >
          <Meter value={87} max={100} band={[70, 100]} color="var(--sub-mint)" />
        </Kpi>
      </Card>
      <div className="flex gap-2">
        <Button>Registrar toma</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="soft">Suave</Button>
      </div>
    </div>
  )
}
