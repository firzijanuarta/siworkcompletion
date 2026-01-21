const track = document.querySelector('.slider-track')
const slides = document.querySelectorAll('.slider-track img')
const nextBtn = document.querySelector('.next')
const prevBtn = document.querySelector('.prev')

let index = 0
const slideWidth = slides[0].clientWidth

function showSlide() {
  track.style.transform = `translateX(-${index * slideWidth}px)`
}

nextBtn.addEventListener('click', () => {
  index = (index + 1) % slides.length
  showSlide()
  resetAutoSlide()
})

prevBtn.addEventListener('click', () => {
  index = (index - 1 + slides.length) % slides.length
  showSlide()
  resetAutoSlide()
})

// AUTO SLIDE
let autoSlide = setInterval(() => {
  index = (index + 1) % slides.length
  showSlide()
}, 4000)

function resetAutoSlide() {
  clearInterval(autoSlide)
  autoSlide = setInterval(() => {
    index = (index + 1) % slides.length
    showSlide()
  }, 4000)
}
