# Guia Completo: Pop-up de Conquista no Android (Visual Xbox / Epic Games Store)

Este guia prático ensina a construir um sistema nativo de pop-up de conquista no Android extremamente idêntico ao do Xbox ou da Epic Games Store. O sistema inclui fila inteligente de exibição, efeitos sonoros e exclusão da memória após o uso de forma reativa para evitar memory leaks.

---

## 1. Código XML de Layout Customizado (`layout_achievement_popup.xml`)
Este layout utiliza um `CardView` translúcido com cantos bastante arredondados e borda sutil brilhante para conferir o visual ultra-moderno dos consoles modernos. Ele deve ser salvo em `res/layout/layout_achievement_popup.xml`.

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/achievement_card_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginStart="16dp"
    android:layout_marginEnd="16dp"
    android:layout_marginTop="24dp"
    app:cardCornerRadius="24dp"
    app:cardBackgroundColor="#F80B0B14"
    app:cardElevation="12dp"
    app:strokeColor="#40FFB300"
    app:strokeWidth="1dp">

    <androidx.constraintlayout.widget.ConstraintLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:padding="16dp">

        <!-- Círculo de Brilho Traseiro da Conquista -->
        <View
            android:id="@+id/icon_glow_bg"
            android:layout_width="54dp"
            android:layout_height="54dp"
            android:background="@drawable/radial_gold_glow"
            android:alpha="0.6"
            app:layout_constraintStart_toStartOf="parent"
            app:layout_constraintTop_toTopOf="parent"
            app:layout_constraintBottom_toBottomOf="parent" />

        <!-- Círculo e Ícone do Troféu -->
        <FrameLayout
            android:id="@+id/icon_container"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:background="@drawable/circle_gold_gradient"
            app:layout_constraintStart_toStartOf="@id/icon_glow_bg"
            app:layout_constraintEnd_toEndOf="@id/icon_glow_bg"
            app:layout_constraintTop_toTopOf="@id/icon_glow_bg"
            app:layout_constraintBottom_toBottomOf="@id/icon_glow_bg">

            <ImageView
                android:id="@+id/achievement_icon"
                android:layout_width="22dp"
                android:layout_height="22dp"
                android:layout_gravity="center"
                android:src="@drawable/ic_trophy"
                android:contentDescription="Troféu"
                app:tint="#0A0A0E" />
        </FrameLayout>

        <!-- Container do Texto das Conquistas -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:layout_marginStart="16dp"
            android:layout_marginEnd="12dp"
            android:gravity="center_vertical textStart"
            app:layout_constraintStart_toEndOf="@id/icon_glow_bg"
            app:layout_constraintEnd_toStartOf="@id/score_container"
            app:layout_constraintTop_toTopOf="parent"
            app:layout_constraintBottom_toBottomOf="parent">

            <LinearLayout
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical">

                <ImageView
                    android:layout_width="12dp"
                    android:layout_height="12dp"
                    android:src="@drawable/ic_sparkle"
                    app:tint="#FFC400"
                    android:layout_marginEnd="4dp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="CONQUISTA DESBLOQUEADA"
                    android:textColor="#FFC400"
                    android:textSize="10sp"
                    android:textStyle="bold"
                    android:letterSpacing="0.08" />
            </LinearLayout>

            <TextView
                android:id="@+id/txt_achievement_title"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Mestre da Velocidade 🚀"
                android:textColor="#FFFFFF"
                android:textSize="14sp"
                android:textStyle="bold"
                android:layout_marginTop="2dp"
                android:ellipsize="end"
                android:singleLine="true" />

            <TextView
                android:id="@+id/txt_achievement_desc"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Alcançou com sucesso o Nível 8 de estudo."
                android:textColor="#8D8E9F"
                android:textSize="11sp"
                android:layout_marginTop="1dp"
                android:ellipsize="end"
                android:singleLine="true" />
        </LinearLayout>

        <!-- Indicador de Pontos Xbox / Gamerscore -->
        <LinearLayout
            android:id="@+id/score_container"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:paddingStart="8dp"
            android:paddingEnd="8dp"
            android:paddingTop="4dp"
            android:paddingBottom="4dp"
            android:background="@drawable/bg_xp_chip"
            app:layout_constraintEnd_toEndOf="parent"
            app:layout_constraintTop_toTopOf="parent"
            app:layout_constraintBottom_toBottomOf="parent">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+50 XP"
                android:textColor="#FFC400"
                android:textSize="10sp"
                android:textStyle="bold" />
        </LinearLayout>

    </androidx.constraintlayout.widget.ConstraintLayout>
</androidx.cardview.widget.CardView>
```

---

## 2. Animações XML (`res/anim`)
Garantem suavidade e dinâmica física idêntica à do Xbox (uma mola que desliza do topo suavemente, estabiliza e depois sobe girando levemente).

### A. Animação de Entrada (`anim_achievement_enter.xml`)
Cria um efeito translúcido (fade-in) com um slide de cima para baixo:
```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="400"
    android:interpolator="@android:anim/overshoot_interpolator">
    
    <translate
        android:fromYDelta="-120%"
        android:toYDelta="0%" />
        
    <alpha
        android:fromAlpha="0.0"
        android:toAlpha="1.0" />
        
    <scale
        android:fromXScale="0.9"
        android:toXScale="1.0"
        android:fromYScale="0.9"
        android:toYScale="1.0"
        android:pivotX="50%"
        android:pivotY="50%" />
</set>
```

### B. Animação de Saída (`anim_achievement_exit.xml`)
Cria uma transição de fade-out deslizando de volta para cima acelerado:
```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="350"
    android:interpolator="@android:anim/accelerate_interpolator">
    
    <translate
        android:fromYDelta="0%"
        android:toYDelta="-120%" />
        
    <alpha
        android:fromAlpha="1.0"
        android:toAlpha="0.0" />
</set>
```

---

## 3. Código Kotlin de Gerenciamento (`AchievementNotificationManager.kt`)
Esta classe reativa de gerenciamento possui uma **fila em memória (Queue)** para gerenciar múltiplas conquistas seguidas sem sobreposição ou memory leaks. Ela infla a View de maneira dinâmica utilizando o WindowManager atual ou acopla inteligente no `DecorView` da Activity, prevenindo crashes.

```kotlin
package com.cosmos.studymaster.utils

import android.animation.Animator
import android.app.Activity
import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.TextView
import com.cosmos.studymaster.R
import java.lang.ref.WeakReference
import java.util.*

/**
 * Gerenciador nativo de notificações de conquistas desbloqueadas (Xbox/Epic style).
 * Possui fila integrada de execução e previne vazamentos de memória (Memory Leaks).
 */
class AchievementNotificationManager private constructor(context: Context) {

    private val appContext: Context = context.applicationContext
    private val achievementQueue: Queue<AchievementItem> = LinkedList()
    private var isDisplaying = false
    private var soundPool: SoundPool? = null
    private var chimeSoundId: Int = 0

    init {
        initSoundPool()
    }

    companion object {
        @Volatile
        private var INSTANCE: AchievementNotificationManager? = null

        fun getInstance(context: Context): AchievementNotificationManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AchievementNotificationManager(context).also { INSTANCE = it }
            }
        }
    }

    data class AchievementItem(
        val title: String,
        val desc: String,
        val iconRes: Int? = null
    )

    /**
     * Enfileira uma nova conquista com segurança.
     */
    fun showAchievement(activity: Activity, title: String, desc: String, iconRes: Int? = null) {
        val weakActivity = WeakReference(activity)
        achievementQueue.add(AchievementItem(title, desc, iconRes))
        processQueue(weakActivity)
    }

    private fun processQueue(weakActivity: WeakReference<Activity>) {
        val activity = weakActivity.get()
        if (activity == null || activity.isFinishing || activity.isDestroyed) {
            achievementQueue.clear() // Remove itens órfãos se a tela sumiu
            isDisplaying = false
            return
        }

        if (isDisplaying || achievementQueue.isEmpty()) return

        isDisplaying = true
        val item = achievementQueue.poll() ?: return

        displayNotification(activity, item, weakActivity)
    }

    private fun displayNotification(
        activity: Activity,
        item: AchievementItem,
        weakActivity: WeakReference<Activity>
    ) {
        val rootLayout = activity.window?.decorView?.findViewById<ViewGroup>(android.R.id.content) ?: return
        
        // Infla dinamicamente a view de Conquista
        val inflater = LayoutInflater.from(activity)
        val popupView = inflater.inflate(R.layout.layout_achievement_popup, rootLayout, false)

        // Configura dados
        popupView.findViewById<TextView>(R.id.txt_achievement_title).text = item.title
        popupView.findViewById<TextView>(R.id.txt_achievement_desc).text = item.desc

        // Adiciona ao Layout principal
        rootLayout.addView(popupView)

        // Carrega as Animações
        val enterAnim = AnimationUtils.loadAnimation(activity, R.anim.anim_achievement_enter)
        val exitAnim = AnimationUtils.loadAnimation(activity, R.anim.anim_achievement_exit)

        // Toca o efeito sonoro clássico
        playChime()

        popupView.startAnimation(enterAnim)

        // Temporizador para permanência e saída automática segura
        popupView.postDelayed({
            if (activity.isFinishing || activity.isDestroyed) return@postDelayed
            
            exitAnim.setAnimationListener(object : Animation.AnimationListener {
                override fun onAnimationStart(animation: Animation?) {}
                
                override fun onAnimationEnd(animation: Animation?) {
                    // Remove da janela física de forma segura
                    rootLayout.removeView(popupView)
                    // Dispara a próxima conquista da fila com atraso para suavidade
                    isDisplaying = false
                    popupView.postDelayed({
                        processQueue(weakActivity)
                    }, 500)
                }

                override fun onAnimationRepeat(animation: Animation?) {}
            })
            popupView.startAnimation(exitAnim)
        }, 4000) // 4 segundos de permanência do card
    }

    private fun initSoundPool() {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        
        soundPool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(audioAttributes)
            .build()

        // Coloque seu arquivo .wav ou .mp3 de chirp curto em res/raw/achievement_chime.wav
        chimeSoundId = soundPool?.load(appContext, R.raw.achievement_chime, 1) ?: 0
    }

    private fun playChime() {
        soundPool?.play(chimeSoundId, 1.0f, 1.0f, 0, 0, 1.0f)
    }
}
```

---

## 4. Como Chamar em sua Activity (Uso Prático)
Executa a conquista com uma só linha de programação e fila automática integrada para quantas conquistas consecutivas você desejar:

```kotlin
class HomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        // Registrar conquista de exemplo
        buttonConfirm.setOnClickListener {
            AchievementNotificationManager.getInstance(this).showAchievement(
                activity = this,
                title = "Alquimista do Vácuo 🧪",
                desc = "Acertou 15+ questões de Ciências da Natureza"
            )
            
            // Fila instantânea testada:
            AchievementNotificationManager.getInstance(this).showAchievement(
                activity = this,
                title = "Ancião Cósmico 🧝",
                desc = "Pertence ao seleto grupo que atingiu o Nível 100"
            )
        }
    }
}
```
