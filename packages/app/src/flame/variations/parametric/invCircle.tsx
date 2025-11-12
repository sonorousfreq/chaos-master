import { f32, i32, struct, vec2f } from 'typegpu/data'
import { CheckboxEditor } from '@/components/Sliders/ParametricEditors/CheckboxEditor'
import { RangeEditor } from '@/components/Sliders/ParametricEditors/RangeEditor'
import { editorProps } from '@/components/Sliders/ParametricEditors/types'
import { parametricVariation } from './types'
import type { Infer } from 'typegpu/data'
import type { EditorFor } from '@/components/Sliders/ParametricEditors/types'

type InvCircleParams = Infer<typeof InvCircleParams>
const InvCircleParams = struct({
  radius: f32,
  a: f32,
  b: f32,
  restricted: i32,
})

const InvCircleParamsDefaults: InvCircleParams = {
  radius: 1,
  a: 0,
  b: 0,
  restricted: 1,
}

const InvCircleParamsEditor: EditorFor<InvCircleParams> = (props) => (
  <>
    <RangeEditor
      {...editorProps(props, 'radius', 'Radius')}
      min={-5}
      max={5}
      step={0.01}
    />
    <RangeEditor
      {...editorProps(props, 'a', 'a')}
      min={-10}
      max={10}
      step={0.01}
    />
    <RangeEditor
      {...editorProps(props, 'b', 'b')}
      min={-10}
      max={10}
      step={0.01}
    />
    <CheckboxEditor {...editorProps(props, 'restricted', 'Restricted')} />
  </>
)

export const invCircle = parametricVariation(
  'invCircle',
  InvCircleParams,
  InvCircleParamsDefaults,
  InvCircleParamsEditor,
  (pos, _varInfo, P) => {
    'use gpu'
    const dx = pos.x - P.a
    const dy = pos.y - P.b
    const d2 = dx * dx + dy * dy
    // d2 should not be 0, Ic(0,0) = Inf, Ic(Inf) = 0
    const r2 = P.radius * P.radius

    // restricted/unrestricted circle handling
    if (P.restricted === 1) {
      if (d2 < r2) {
        // point stays the same if we hit inside of a circle,
        // meaning no transformation happens at this orbit stage,
        // the IFS chaos game will still converge given the following is satisfied:
        //   the starting random point was not inside all defined circles, the circles can
        //   touch and overlap as usual
        return pos
      }
    }
    const u = P.a + (r2 * dx) / d2
    const v = P.b + (r2 * dy) / d2
    return vec2f(u, v)
  },
)
