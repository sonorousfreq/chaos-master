import { f32, i32, struct, vec2f } from 'typegpu/data'
import { select } from 'typegpu/std'
import { CheckboxEditor } from '@/components/Sliders/ParametricEditors/CheckboxEditor'
import { RangeEditor } from '@/components/Sliders/ParametricEditors/RangeEditor'
import { editorProps } from '@/components/Sliders/ParametricEditors/types'
import { quadraticFuncImpl } from '../mathFunctions'
import { parametricVariation } from './types'
import type { Infer } from 'typegpu/data'
import type { EditorFor } from '@/components/Sliders/ParametricEditors/types'

type InvCircleParams = Infer<typeof InvCircleParams>
const InvCircleParams = struct({
  radius: f32,
  a: f32,
  b: f32,
  cx: f32,
  cy: f32,
  restricted: i32,
})

const InvCircleParamsDefaults: InvCircleParams = {
  radius: 1,
  a: 0,
  b: 0,
  cx: 0,
  cy: 0,
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
    <RangeEditor
      {...editorProps(props, 'cx', 'Inversion centre x')}
      min={
        props.value.a -
        Math.sqrt(
          props.value.radius * props.value.radius -
            Math.pow(props.value.cy - props.value.b, 2),
        )
      }
      max={
        props.value.a +
        Math.sqrt(
          props.value.radius * props.value.radius -
            Math.pow(props.value.cy - props.value.b, 2),
        )
      }
      step={0.01}
    />
    <RangeEditor
      {...editorProps(props, 'cy', 'Inversion centre y')}
      min={
        (Math.min(
          props.value.b -
            Math.sqrt(
              props.value.radius * props.value.radius -
                Math.pow(props.value.cx - props.value.a, 2),
            ),
        ),
        0)
      }
      max={Math.min(
        props.value.a +
          Math.sqrt(
            props.value.radius * props.value.radius -
              Math.pow(props.value.cx - props.value.a, 2),
          ),
        1,
      )}
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

    const vx = pos.x - P.cx
    const vy = pos.y - P.cy
    const vx2 = vx * vx
    const vy2 = vy * vy
    const wx = P.cx - P.a
    const wy = P.cy - P.b
    const wx2 = wx * wx
    const wy2 = wy * wy
    const a = vx2 + vy2
    const b = 2.0 * (wx * vx + wy * vy)
    const c = wx2 + wy2 - r2
    const tres = quadraticFuncImpl(a, b, c)
    const tsol = select(tres.x, tres.y, tres.x > tres.y)
    const tsol2 = tsol * tsol

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
    // const u = P.a + (r2 * dx) / d2
    // const v = P.b + (r2 * dy) / d2
    const cu = P.cx + tsol2 * vx
    const cv = P.cy + tsol2 * vy
    return vec2f(cu, cv)
  },
)
