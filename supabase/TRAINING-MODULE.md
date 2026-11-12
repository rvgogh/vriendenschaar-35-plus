# Training-module: database klaarzetten

De schermen van de training-module werken pas als de vier migraties hieronder op het Supabase-project
(`ocsmgsowzecxetmhsgqo`) zijn uitgevoerd. Lovable voert migraties die via GitHub binnenkomen niet vanzelf uit;
je moet er één keer om vragen.

## Volgorde

| # | Bestand in `supabase/migrations/` | Wat het doet |
|---|---|---|
| 1 | `20261110170000_5b1c2a4e-7d10-4c1f-9a51-0f1a2b3c4d01.sql` | Voegt de rol `trainer` toe aan `app_role` |
| 2 | `20261110170100_5b1c2a4e-7d10-4c1f-9a51-0f1a2b3c4d02.sql` | Zes nieuwe tabellen, toegangsregels (RLS) en drie functies |
| 3 | `20261110170200_5b1c2a4e-7d10-4c1f-9a51-0f1a2b3c4d03.sql` | Vult `drills` met de 34 oefeningen |
| 4 | `20261112170000_5b1c2a4e-7d10-4c1f-9a51-0f1a2b3c4d04.sql` | Voorkeursposities op volgorde (1-2-3-1), niveau Rookie / Eeuwig talent / GOAT, functie `set_my_positions` voor spelers |

Zijn 1–3 al uitgevoerd? Dan alleen nummer 4. Eerder ingevulde posities en niveaus worden omgezet
(Middenvelder → Mid-mid, Aanvaller → Spits; niveau 1–2 → Rookie, 3 → Eeuwig talent, 4–5 → GOAT).

Eigenschappen:
- Alleen toevoegingen. Bestaande tabellen, policies en gegevens (spelers, aanmeldingen, bardiensten) worden niet gewijzigd.
  De enige wijziging aan iets bestaands is de extra waarde `trainer` in het type `app_role`.
- Alle vier mogen veilig een tweede keer gedraaid worden (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT`).
- Zolang ze niet gedraaid zijn, blijft de bestaande app gewoon werken; de nieuwe pagina's tonen dan een melding.

## Via Lovable

Plak dit in de Lovable-chat:

> Voer de openstaande Supabase-migraties voor de training-module uit, in de volgorde uit
> `supabase/TRAINING-MODULE.md`. Gebruik de SQL uit de bestanden letterlijk: pas niets aan, voeg niets toe
> en wijzig geen bestaande tabellen of policies. Werk daarna `src/integrations/supabase/types.ts` bij.
> Verander verder geen code.

Lovable kan de SQL opnieuw wegschrijven als eigen migratiebestanden. Dat is niet erg: de scripts zijn herhaalbaar.

## Zonder Lovable

Open in het Supabase-dashboard de SQL Editor en voer de inhoud van de bestanden uit, in bovenstaande volgorde.

## Controleren

```sql
select count(*) from public.drills;                 -- 34
select count(*) from public.player_training_info;   -- gelijk aan het aantal spelers
select public.is_trainer(auth.uid());               -- true voor een beheerder
```

## Daarna in de app

1. Spelers zetten hun posities op volgorde via Menu → **Mijn posities**.
   Trainers kunnen dat ook doen in Training plannen → tab **Spelers**, en zetten daar team en niveau
   (iedereen begint als Eeuwig talent).
2. Beheerders zetten daar ook de schakelaar **Trainer** aan voor spelers die trainingen mogen maken.
   Beheerders zijn zelf altijd trainer.
3. Tab **Trainingen**: kies een avond, bekijk het voorstel en publiceer.
