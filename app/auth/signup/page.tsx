'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: 12,
            background: 'rgba(0,214,143,0.1)',
            border: '1px solid rgba(0,214,143,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 22,
          }}>✓</div>
          <h2 style={{ ...headingStyle, marginBottom: 10 }}>Check your email</h2>
          <p style={{ color: 'var(--t4)', fontSize: 14, lineHeight: 1.65 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--t2)' }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <p style={{ color: 'var(--t5)', fontSize: 12, marginTop: 16 }}>
            Check your spam folder if you don&apos;t see it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAB9KADAAQAAAABAAAB9AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgB9AH0AwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAIP/aAAwDAQACEQMRAD8A/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Q/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/R/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/S/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/T/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/U/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/V/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/W/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/X/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Q/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPtXxJ+xL8R4v2fNA/aK8CBtb0vUbM3GoW0Sf6RZlHZS+0f6yLC5LDlM8jaC1fFVf1n/ALBv/Jongb/rxf8A9GyV8h/tl/8ABNbRfiH9r+JfwBhi03Xm3S3OljEdteN1LRfwxSn04Rj12nJP7rn3hHUqZThs2yROUpUoSnT3bbim3Dvffl/8B6RP5z4b8b6VLOsXknEDUYxrVI06uySU2oxqdrKyU9v5usj+eyitbXdB1vwvrNz4d8R2k1hf2cjRT286GOSN16qynBBHvWTX4ZKMoycZKzR/RUJxnFTg7p6prZoKKKKkoKKKKACiiigAooooAKKKKACiiigAooooA+4/i/8AsO/ELwF8HvDfx48IB9b8Paxo1jqV75a/v7CS4gSR96j70ILHbIPujh8YDN8OV/Yr+zMiS/s0fD6OQBlbwzpIIPIINrHX5mftnf8ABM+11r7X8UP2brVbe7+aW70JMLHL3LWvQI3/AEy4U/wYOFP7vxb4RVI4KnmmRpyThGU6e7TaTbh3X93f+W+y/m/gnxwpSzCrk3EMlBqcowq7RaUmkqnSL6KWz+1bd/g7RVq+sb3TL2bTdShe3uLd2jlilUo6OpwVZTggg8EHkGqtfhLTTsz+j001dbBRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf//R/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua+Rv2Df8Ak0TwN/14v/6Nkr65r/QPhb/kS4H/AK9U/wD0hH+Y/GX/ACP8x/6/1f8A05I+Nf2rf2LPhp+0/o7Xt4q6T4nt49trqsKAsQOkcy8eZH6ZO5f4SOQf5oPjX8C/iT+z/wCMpfBPxKsGtbgZaCZctBcxj/lpE+AGX8ip4YA8V/ZTXlnxg+DHw6+O3g2fwN8StPS+s5fmjf7s0EmMCSJ+qOPUcEcEEEivhePvC7B57GWLwlqWK7/Zn5Tt1/vLXvdWt+i+GnjFjuHJRwOOvVwX8v2qfnBvp3g9Ozi73/jKor7c/a2/Yg+Iv7MWpPrUe7WfCc8m231ONcGIseI7hR9x+wb7j9iDlR8R1/JGbZRjMsxMsHjqbhUjun+aezT6NaM/t7Jc7wOb4SGOy6qqlKWzX5Nbprqmk11CiiivNPVCiiigAooooAKKKKACiiigAooooA/sX/Zi/wCTa/h7/wBizpP/AKSx17jXh37MX/Jtfw9/7FnSf/SWOvca/wBDsm/5F+H/AMEP/SUf5c59/wAjPFf9fJ/+lM+BP2wP2DvAn7SdlN4q8PeVonjGNP3d6FxFdbRwlyqjJ9BIBvUY+8AFr+bH4mfC/wAd/B7xfc+BfiLp0umalanmOQfK6no6MMq6NjhlJBr+0mvBP2gv2b/hj+0l4QPhb4hWmZYgxs76HC3Nq7fxRtg8HjchyrY5GQCPzDxA8KsNnKljsvtTxW76Rqf4u0v73X7V91+v+GPjPi8gcMuzRurg9l1nT/w94/3Xt9m2z/jyor6h/aa/ZN+J37MHib+zvFkP2zSLlyLHVYFPkTjqFPXy5AOqNzwSCy818vV/JuYZdicBiJ4XGU3CpHRp7/8ADdmtGtUf2xleaYTMcLDG4GqqlKaupJ6P/JrZp6p6PUKKKK4jvCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9L+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/rP/AGDf+TRPA3/Xi/8A6Nkr65r5G/YN/wCTRPA3/Xi//o2Svrmv9A+Fv+RLgf8Ar1T/APSEf5j8Zf8AI/zH/r/V/wDTkgooor3T5sz9V0nS9d0yfRdbtoryzuo2imgmQSRyIwwVZWBBBHUEV+Cn7ZX/AATP1Pwh9q+Jn7OtvLfaUN0t1oy5kuLYdS1v1aSP/Y5de24fd/fuivluK+D8u4gw31fGw95fDNfFF+T7d09H62Z9lwXx1mnDOL+s5fP3X8cH8E15rv2ktV6XT/h4IKkqwwR1FJX9Jn7ZP/BOvwr8bxdfET4TrDoviw7pJosbLW/bqd4AxHKf+egGGP3xzuH87PjHwZ4q+H3iW78H+NrCbTNTsX8ue3nXa6n+RBHIYZBHIJFfx1xhwPmPDuI9nio81J/DUXwy/wApd4v5XWp/d3AviHlfFOF9rg5ctaK9+m370fP+9HtJfOz0OZooor40+8CiiigAooooAKKKKACiiigD+xf9mL/k2v4e/wDYs6T/AOksde414d+zF/ybX8Pf+xZ0n/0ljr3Gv9Dsm/5F+H/wQ/8ASUf5c59/yM8V/wBfJ/8ApTCiiivSPJOX8aeCvCfxE8M3fg3xvYQ6npl8mye3nXcrDsfUEHlWBBU8gg81/Of+2X/wTz8WfAiS5+IPwxWbWvCGTJIMb7nTx6SgD54h2kA4H3wOGb+limuiSoY5AGVhgg8gg18ZxjwNl3EWH9niVy1UvdqJe9Hy8494v5Wep99wH4iZpwtivaYSXNRk/fpt+7LzX8su0l801ofw80V+8X7Z3/BM+11r7X8UP2brVbe7+aW70JMLHL3LWvQI3/TLhT/Bg4U/hPfWN7pl7NpupQvb3Fu7RyxSqUdHU4KspwQQeCDyDX8c8U8I5jkGK+rY6Gj+GS+GS7p/mnqu21/7v4N43yviXBrF5dPVfFB6Tg+0l27NaPo9GirRRRXzB9eFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH//T/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua+Rv2Df8Ak0TwN/14v/6Nkr65r/QPhb/kS4H/AK9U/wD0hH+Y/GX/ACP8x/6/1f8A05IKKKK90+bCiiigAr5f/aZ/ZM+F/wC0/wCG/wCz/FsP2PV7ZCtlqsCj7RAeoU9PMjz1jY45JBU819QUVxZhl2Gx2HnhcZTU6ctGnt/w/ZrVPVHoZXmuLy3FQxuBqunVg7qSdmv80+qejWj0P49v2hP2a/ih+zZ4tPhr4g2n+jzFjZ38OWtrpB3RsDDD+JGwy9xggnwCv7T/AIjfDXwP8WvCV14G+IenRanpl2PnilHRh0ZGHzI6/wALKQR2NfzefthfsBeOP2dLifxn4P8AN1zwczZFyFzPZgnhbhVGNvYSgbSeoUkA/wAn+IHhRicn5sdlt6mF3a3lT9e8f73T7Xd/2r4ZeNOEz3ky7NbUsZsntCp/h/lk/wCV7/Z7L886KKK/HD93CiiigAooooAKKKKAP7F/2Yv+Ta/h7/2LOk/+ksde414d+zF/ybX8Pf8AsWdJ/wDSWOvca/0Oyb/kX4f/AAQ/9JR/lzn3/IzxX/Xyf/pTCiiivSPJCiiigAr4E/bA/YO8CftJ2U3irw95WieMY0/d3oXEV1tHCXKqMn0EgG9Rj7wAWvvuivLzjJcHmuFlg8fTU6cuj6PunumujWp7GQ5/j8mxkMfltV06seq6rqmtmn1T0P4tviZ8L/Hfwe8X3PgX4i6dLpmpWp5jkHyup6OjDKujY4ZSQa4Cv7Df2gv2b/hj+0l4QPhb4hWmZYgxs76HC3Nq7fxRtg8HjchyrY5GQCP5k/2mv2Tfid+zB4m/s7xZD9s0i5cix1WBT5E46hT18uQDqjc8EgsvNfyHx74ZYzIJvE0L1MK3pLrHyml+Etn5N2P7k8NfF3AcTQjhMRaljEtYX0nbd029+7i/eXmlc+XqKKK/Lz9gCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//U/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua+Rv2Df8Ak0TwN/14v/6Nkr65r/QPhb/kS4H/AK9U/wD0hH+Y/GX/ACP8x/6/1f8A05IKKKK90+bCiiigAooooAKhuLe3vLeS0u41lilUo6OAysrDBBB4II6ipqKGr6MabTuj8Pv2y/8AgmUGF18Tv2abXB+aW70BOnqzWn/xn/vjslfh/c21zZXMlneRtDNCxR0cFWVlOCCDyCDwQa/uBr89/wBsH9gXwN+0bbT+MfCflaH4xVci6C4gvCo4W4VRnPYSgbgOoYAAfz/4g+D1PE8+YZDFRqbypbRl5w6Rf934X0s9/wCmvDHx1qYTkyviSTlS2jW3lHyn1lH+98S63W38v9Fd58Sfhl46+EXi658DfETTpdM1O1PzRSDhlOcOjDKujY4ZSQfWuDr+ZK9CpRqSpVYuMouzTVmmujT2Z/XeHxFKvSjWoTUoSV007pp7NNaNMKKKKyNgooooA/sX/Zi/5Nr+Hv8A2LOk/wDpLHXuNeHfsxf8m1/D3/sWdJ/9JY69xr/Q7Jv+Rfh/8EP/AElH+XOff8jPFf8AXyf/AKUwooor0jyQooooAKKKKACuX8aeCvCfxE8M3fg3xvYQ6npl8mye3nXcrDsfUEHlWBBU8gg811FFRUpwqQdOok4tWaeqafRrqjSlVnSnGrSk4yTumnZprZprZo/mn/bL/wCCefiz4ESXPxB+GKza14QyZJBjfc6ePSUAfPEO0gHA++BwzfmfX9wzokqGOQBlYYIPIINfi3+2d/wTPtda+1/FD9m61W3u/mlu9CTCxy9y1r0CN/0y4U/wYOFP80+IXg9Klz5jkEbx3lS6rzh3X93dfZvsv628MPHWFfkyriWaU9o1non2VTs/7+z+1Z6v8HaKtX1je6ZezabqUL29xbu0csUqlHR1OCrKcEEHgg8g1Vr+eWmnZn9Qppq62CiiikMKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//V/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua+Rv2Df8Ak0TwN/14v/6Nkr65r/QPhb/kS4H/AK9U/wD0hH+Y/GX/ACP8x/6/1f8A05IKKKK90+bCiiigAooooAKKKKACiiigDwP9oL9m74YftJeET4Y+IVnmaIMbO+hwtzaue8bYPB/iQ5Vu4yAR/Mv+05+yV8T/ANmDxJ9h8VQ/bdGuXK2WqwKfInHUK3Xy5MdUY9iVLDmv65K5vxf4P8L+PvDd34Q8aWEOpaZfIY57eddyOp/kQeQRgggEEEV+ccdeG+B4hputG1PEpaTS37Ka6rz3XTTR/q/hz4r5lwvUVCV6uEb1pt/D3cH9l918Mutn7y/ibor9Qf2yf+CdHin4KG6+InwjWbWvCg3STQY33VgvU7sDMkQ/vjlR98cbj+X1fyBn3D+OyfFSweYU3Ga27Nd4vqv+Gdnof3Nw3xPl2e4KOPyyqpwe/eL/AJZLdNf8FXTTCiiivFPfP7F/2Yv+Ta/h7/2LOk/+ksde414d+zF/ybX8Pf8AsWdJ/wDSWOvca/0Oyb/kX4f/AAQ/9JR/lzn3/IzxX/Xyf/pTCiiivSPJCiiigAooooAKKKKACiiigD+TT9vdQn7XvjgD/n8jP5wx18hV9h/t+jH7YHjcf9PUP/pPFXx5X+f3Fa/4W8d/1+qf+lyP9N+DHfh/Ln/04pf+m4hRRRXgH0oUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf//W/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua+Rv2Df8Ak0TwN/14v/6Nkr65r/QPhb/kS4H/AK9U/wD0hH+Y/GX/ACP8x/6/1f8A05IKKKK90+bCiiigAooooAKKKKACiiigApCQOvelr81P+CpHjXxZ8PPgh4Z8YeCL+bTNTsvFFq8NxA211P2W7yPQgjgqQQRwQRXj5/nEMqy+tmFSLlGmrtLdq/Q93hnIp5zmlDK6c1GVV8qb1Sdna9un9an6VEAjB5Br8eP2y/8AgmhpfjP7V8TP2d7eKw1c7pbrRhiO3uT1LQdFikP9zhG7bTnd6f8Asbf8FE/CnxxFt8PPis0Oi+LSFjikzstb9ug8sk/JKe8ZOGP3Cc7R+nNfP1qGQ8aZUnpUpvZrSdOX5xkuqejXdPX6ehiOJOAM5as6VVbp606kfylF9GtU+sZLT+IjV9H1Xw/qlxomu20tneWkjRTQToY5I3U4KsrYIIPUGs6v6sP2tP2Ivhz+09pbavhdH8VwR7bbU41/1gUcR3Cj/WJ2B+8nY4yp/mk+MXwV+I3wH8ZTeB/iVp7WV3Hlo3HzQzx5wJInxh0Pr1B4IBBFfytxv4e5hw7V5prnw7fu1EtPSS+zL8H0e9v7M8PfFDLOKaHJTfs8VFe9Tb19Yv7UfxXVLRv+sL9mL/k2v4e/9izpP/pLHXuNeHfsxf8AJtfw9/7FnSf/AEljr3Gv7Pyb/kX4f/BD/wBJR/Auff8AIzxX/Xyf/pTCiiivSPJCiiigAooooAKKKKACiiigD+T/AP4KCLt/bD8bD/p5tz+dtFXxvX2d/wAFCht/bG8bD/pva/8ApLDXxjX+f/Fq/wCFzH/9fqv/AKXI/wBNeCXfh3LX/wBOKP8A6biFFFFfPn04UUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf/X/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP6z/wBg3/k0TwN/14v/AOjZK+ua/MP/AIJt/tL/AAw8YfB/RfgcLr7F4l0KCSM2lwQv2lN7PvgPR8A/Mv3lwTjb81fp5X98cF47D4rI8HPD1FJKnCLs9pRik0+zT3R/mp4gZdicHxFj6eKpuDlVqSV1a8ZTbjJd01s0FFFFfUHxwUUUUAFFFFABRRRQAUUUUAFflZ/wV6/5Nr0T/sZrb/0lu6/VOvys/wCCvX/Jteif9jNbf+kt3XxPiP8A8kzj/wDA/wA0foXhT/yV2W/9fF+TP5y1YqQynBHIIr9j/wBjT/gphqXhP7L8Mv2i7iS90sbYrXWmzJPbjoFuOrSJ/t8uvfcOV/G+iv414c4nzDI8UsXl9Sz6p/DJdpLqvxXRpn96cV8IZZxFgngszpcy+zJaSg+8X0f4PZprQ/t50rVdM13TYNZ0W4iu7S6RZYZ4XEkciMMhlZcggjoRXmXxo+Bvw2+P3g2XwT8S9PW8tmy0Mq4We2kxxJC+CVYfiCOGBGRX82X7JX7cXxF/Zj1KPRJy+s+E5nzPpkj8xbjzJbsfuN3K/cfvg4Yf0sfCH4zfDr46eDYPHPw11FL+zlwsi/dlgkxkxyp1Rx6HgjkEggn+u+EuN8p4rwksNUilUa9+lKzuurV/ij+K6paX/h3jbw8zrgvGwxdKbdJSvTrQurPopW+CXzs+jeqW98OPBsHw6+Hug/D61na5i0LTrXTkmcbWkW1iWMMQOAWC5Irs6KK/QaNKFKnGlTVoxSSXktEfmFetOtUlWqO8pNtvu3qwooorQyCiiigAooooAKKKKACiiigD+Ur/AIKILt/bI8aj/prZn87SCviyvtj/AIKLDb+2X40H+3Zf+kcFfE9fwDxf/wAj7MP+v1X/ANLkf6Z8DO/DeWP/AKcUf/TcQooor50+pCiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P4T6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigC5p2o6hpF/DqukzyWt1bOskU0LFJI3U5DKykEEHkEHIr93/wBjX/gpnY+Ifsnwx/aPuEtb/wCWK11xsJDMegW56BH/AOmgwh/i2n5m/BSivqOFeL8xyDFfWMDPR/FB/DJea79mtV96Pj+MuBsr4mwf1XMYe8vgmvjg+6fbvF6PtdJr+4ZHSRBJGQysMgjkEGnV/NJ+xv8A8FDvF/wHe1+H/wATDNrfhAEJGc7rqwHrET9+Md4ieB9wjBDf0YeCPHPhD4k+GLTxn4F1CHVNLvU3w3EDZVh3BHBVgeGVgGU8EA1/YnB3HOXcRYfnw0uWql71N/FHzXePaS+dnofwlx54dZpwtifZ4uPNRk/cqJe7Lyf8su8X8m1qdXRRRX2h8AFFFFABRRRQAUUUUAFflZ/wV6/5Nr0T/sZrb/0lu6/VOvys/wCCvX/Jteif9jNbf+kt3XxPiP8A8kzj/wDA/wA0foXhT/yV2W/9fF+TP5yqKKK/hU/0aCvYPgn8dviV+z94yj8a/DW/NrOMLPA+Wt7mMH7kqZAZfToVPKkHmvH6K6MLiq2GrRxGHm4zi7pp2afkzmxmCoYuhPDYqmp05KzjJXTXZpn9YP7KX7aPw0/ag0YWdiy6V4mt4913pUzgvgdZIW48yP1IG5f4gMgn7Hr+I7Qdf1vwtrNt4i8N3c1hf2cglguLdzHJG69GVlIIP0r+gD9jT/gpRovxG+y/DX4+zQ6Zr7bYrbVDiO2vG6ASfwxSn14Rj02nCn+pfD7xdo5hyZfnTUK+yntGfr0jJ/8AgL6Wdkfxx4neB1fLOfM8gi6mH3lT3nT811nBf+BRW91dr9caKKK/cz+cwooooAKKKKACiiigAooooA/lV/4KOqU/bO8aA+tgfzsrc18Q19xf8FIv+T0fGf8A3Dv/AEht6+Ha/gPjL/kf5j/1+q/+nJH+mPAb/wCMayv/ALB6P/puIUUUV82fVhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//9H+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvpb9mv9qn4ofsxeKP7X8Fz/aNNuGBvtLnY/Z7lRxnH8EgH3ZF5HQ5XIr5porswGYYnA4iGKwlRwqRd01uv66rZrRnDmeWYTMMNPB42kqlKas4tXT/4PZrVPVan9gH7On7Tvwv/AGmPCn/CQeA7ry7yAL9t06YgXNq5/vL/ABIT911yrexBA+iK/ir+H3xE8a/CvxXa+N/h/qM2l6nZtmOaE4OO6sDwyt0ZWBUjgg1/R3+x1/wUD8F/tCQ2/gfx55Oh+MQAoizttr4gdYCxOH9YiSe6lhnH9X+H/ixhs35MDmbVPE7J7RqenaT/AJdn9nsv4r8TfBXF5Hz5jlCdXCbtbzprz/miv5lql8S05n+jNFFFfsp+ChRRRQAUUUUAFflZ/wAFev8Ak2vRP+xmtv8A0lu6/VOvys/4K9f8m16J/wBjNbf+kt3XxPiP/wAkzj/8D/NH6F4U/wDJXZb/ANfF+TP5yqKKK/hU/wBGgooooAKKKKAP1W/Y0/4KP+IvhH9l+G/xskm1fwwu2K3veZLqwXoB6ywr/d++o+7kAJX9CvhjxR4d8aaBaeKvCV7DqOm30YlguYHDxyKe4I9DwR1B4PNfxKV9afst/thfE39l7Xw+gyHUdAuZA15pM7kRSdi8Z58uTH8QGDxuDACv2/w+8XK+W8mX5w3PD7Ke8oevWUV23S2urI/nnxO8EMPm3PmeRJU8TvKG0Kj8ukZvv8MnvZtyP61KK8Q+A/7Qvwy/aL8Hr4u+HF6Jtm1bq0kwtzayEfdlTJx3wwyrY+Umvb6/qjB4yhiqMMRhpqdOSumndNH8aY7A4jBYieFxdNwqQdpRkrNPzQUUUV0nIFFFFABRRRQB/K3/AMFIxj9tDxj9NO/9Ibevhuvub/gpKMftneMPpp3/AKRQV8M1/AnGf/JQZj/1+q/+lyP9MOAv+SZyv/sHo/8ApuIUUUV80fWBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//S/hPooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKkhmmt5luLdikiEMrKcEEcggjoRUdFCYNH7Z/sa/8FNZrD7J8Mf2lLlpYflitNebJdOwW67sO3nDkfx55cfuZZ3lnqNnFqGnypPbzoskUsbBkdGGVZWGQQQcgjgiv4gK+/P2Qf28/Hv7Nl3D4U8Q+Zrng93+eyZsy2u4/M9sxOB6mMnYx6bSS1fv3h94w1MLyZfnsnKntGpvKPlPrJefxLrdbfzP4neBVLGc+Z8ORUK28qW0ZecOkZf3dIvpyvf+oyivPvhh8VPAXxk8IW3jr4c6jFqWnXPAeM4ZHHVJFPzI4zyrAHv0Ir0Gv6doV6danGtRkpQkrpp3TT6prc/kHE4arh6sqFeDjOLs01ZprdNPVMKKKK1MQr8rP+CvX/Jteif9jNbf+kt3X6p1+Vn/AAV6/wCTa9E/7Ga2/wDSW7r4nxH/AOSZx/8Agf5o/QvCn/krst/6+L8mfzlUUUV/Cp/o0FFFFABRRRQAUUUUAei/C34r+P8A4MeMLfxz8ONRk03ULfjchykiHqkiH5XQ45VgR36gGv6Tv2Q/28PAH7StnF4Y1vy9D8Xxp+8sGb91c7Ry9szHLDuYyd6jP3gC1fy2VbsL++0u9h1LTJntrm3dZIpYmKOjqchlYYIIPII5Br7vgrj/ADDh2t+6fPQb96m3o/OP8svNb9U9D848QPDPK+KcP+/Xs8RFe5VS1XlJfaj5PVdGru/9vtFfip+xp/wU0ttW+y/DH9pO5WC5+WK011sLHJ2C3WOFb/pr90/x4wWP7URSxzxrNCwdHAZWU5BB6EGv7D4a4py/PcKsVgKl/wCaL0lF9pLp5PZ9Gz+FOLeDc04cxjweZU7fyyWsZrvF9fNaNdUh9FFFfRHyoUUUUAfyv/8ABScY/bN8Xf7un/8ApFBXwvX3V/wUoGP2zPFv+5p//pFBXwrX8CcZ/wDJQZj/ANfqv/pcj/S/gH/kmcr/AOwej/6biFFFFfNH1oUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf/9P+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPdPgH+0V8Tv2cfGC+LPh1ebFk2rd2UuWtrqMH7siZHTnawIZcnBGTn+mb9l79r74Y/tQ+HvO8OSf2frttGGvdJnYedF2LIePMiz0cDjI3BScV/JLXQeFfFfiXwP4htfFfhC+m03UrFxJBcQMUkRh6EdiOCOhHB4r9G4G8R8fw9UVJ/vMM3rBvbzg+j8tn111X5X4i+FOW8UUnWVqWLS92olv2jNfaXZ/FHppdP+2iivyy/Y1/4KOeGvjH9k+HHxleHR/FLbYoLriO1v26ADtHM39w/Kx+6QSEH6m1/YGQcQ4DOcJHGZfU5oPfvF9pLo/wDh1dWZ/C/EvC+ZZDjZYHM6ThNbP7Ml/NF7NP8ADZpO6Cvys/4K9f8AJteif9jNbf8ApLd1+qdflZ/wV6/5Nr0T/sZrb/0lu68PxH/5JnH/AOB/mj6Lwp/5K7Lf+vi/Jn85VFFFfwqf6NBRRRQAUUUUAFFFFABRRRQAV+kH7HP/AAUH8Zfs/SW/gT4g+drng7IVY87rmxHrCWPzIO8RIHdSvIP5v0V6+SZ7jsoxUcZgKjhNfc12a2afZ+u54fEPDmX53g5YDMqSnTf3p9HF7pruvR6No/tX8BfEDwZ8UPCtr428AajDqml3q7op4TkcdVIOCrKeGVgGU8EA12NfyCfs5ftQ/FH9mbxV/bnga582xnZftumzkm2uVHqP4XA+66/MPcZU/wBNP7N37U3wu/ab8Lf2z4IuPI1G3RTfaZOQLm2Y+o/jjJ+7IvB74bKj+veBPEvA8QQVCraniktYX0l3cH1/w7rzWp/DfiR4SZhwxUeJo3q4NvSaWsb7Kols+il8L8m+U+kqKKK/TD8jP5Y/+ClQx+2X4s/3NP8A/SOGvhOvu7/gpWMftleKv+uen/8ApHDXwjX8C8af8lBmP/X6r/6XI/0u4A/5JjK/+wej/wCm4hRRRXzJ9cFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH/9T+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr9e/2NP8AgpXrHgH7J8M/2gZ5dR0NcRW2rHMlzaL0Cy9WliHry6j+8MAfkJRXvcO8S5hkmLWLy+pyy6reMl2kuq/Fbpp6nzfFPCWWcQ4J4HM6XNHo9pRf80X0f4PZprQ/t00TW9H8S6Rba/4euor2xvI1lguIHEkciNyGVhkEH1FfmB/wV6/5Nr0T/sZrb/0lu6/Jj9k/9tb4k/swauun27Nq3he4k3XWlSvgKT1kgY58uT1/hb+IZwR+hn/BRP44/Db4+/sdeH/G3w01Bby2bxNarNE3yz28n2S7JjlTJKsPxBHKkjBr+jMw8Q8v4i4Ux8IvkxCpvmpt+a1i/tR/FdVs3/K2WeF2Z8LcaZbOa9phZVVy1EtNn7s19mX4Po90vwlooor+VT+zQooooAKKKKACiiigAooooAKKKKACuu8C+PPGPwz8UWvjTwHqE2l6pZNuinhbDD1BHRlI4ZWBVhwQRXI0VpSqzpTjUpyakndNOzTXVPozOtRp1qcqVWKlGSs01dNPdNPRpn9MP7HH/BQvwd8fUtvAPxG8nQ/GBASNc7ba/PrCSflkPeIkk/wk8hf0nr+HqOR4nWWJirKQQQcEEdxX7Qfsaf8ABTO80Q2vwx/aRuXubPiK111stLF2C3OMl1/6a/eH8W4EsP6W8P8AxijW5Mvz+Vp7Rq7J+U+z/vbPrbd/yT4neBM6HPmnDUHKG8qO7Xd0+rX9zdfZvsvk3/gpaP8AjMnxT/1y0/8A9JIa+Dq+5/8Ago/f2Gq/tc+IdU0qeO5trm202WKaJg8ciNaQkMrDIII5BHBr4Yr8L40aef5g1t7ap/6Wz+jeAU1wzlaa19hS/wDSIhRRRXzJ9aFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH/9X+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKlE8ywtbK7CN2DMuflLLkAkeoycfU1FRRcLBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAPeSSTHmMW2jAyc4A7UyiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/9b+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9f+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9D+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9H+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9L+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9P+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9T+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9X+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9b+E+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9k=" alt="Nexa" style={{
          width: 28, height: 28, borderRadius: 7, objectFit: 'cover',
        }}/>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Nexa
        </span>
      </div>

      <h1 style={{ ...headingStyle, marginBottom: 6 }}>Create your account</h1>
      <p style={{ color: 'var(--t4)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
        14-day free trial · No credit card required
      </p>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Full name</label>
          <input
            type="text"
            placeholder="Ahmed Al-Rashidi"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
          />
        </div>

        <div>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            placeholder="you@brand.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--cline2)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line2)')}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,107,107,0.07)',
            border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...btnStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(0,0,0,0.2)',
                borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }} />
              Creating account...
            </span>
          ) : 'Create account →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t4)', marginTop: 20 }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t5)', marginTop: 16, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/terms" style={{ color: 'var(--t4)', textDecoration: 'none' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: 'var(--t4)', textDecoration: 'none' }}>Privacy Policy</a>.
      </p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'rgba(13,13,20,0.9)',
  border: '1px solid var(--line2)',
  borderRadius: 18,
  padding: '36px 32px',
  position: 'relative',
  zIndex: 1,
  backdropFilter: 'blur(20px)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--display)',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: 'var(--t1)',
  textAlign: 'center',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t4)',
  marginBottom: 7,
  letterSpacing: '0.01em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  fontFamily: 'var(--sans)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--line2)',
  borderRadius: 10,
  color: 'var(--t1)',
  outline: 'none',
  transition: 'border-color 0.18s',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: 'var(--sans)',
  background: 'var(--cyan)',
  color: '#000',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  transition: 'all 0.18s',
  marginTop: 4,
}
