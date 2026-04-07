// Quick test script for LinkedIn API
import { fetchLinkedInProfile, mapLinkdAPIToCvState } from './src/lib/linkedin/linkdapi.ts';

const linkedinUrl = "https://www.linkedin.com/in/f%C3%A1bio-kr%C3%B6ker-b5a318179/";

console.log("🔄 Testando LinkdAPI com URL:", linkedinUrl);
console.log("─".repeat(80));

try {
  const profileData = await fetchLinkedInProfile(linkedinUrl);

  console.log("\n✅ Dados brutos da LinkdAPI:");
  console.log(JSON.stringify(profileData, null, 2));

  console.log("\n" + "─".repeat(80));
  console.log("🔄 Mapeando para CVState...");

  const cvState = mapLinkdAPIToCvState(profileData);

  console.log("\n✅ CVState Mapeado:");
  console.log(JSON.stringify(cvState, null, 2));

  console.log("\n" + "─".repeat(80));
  console.log("📊 Resumo:");
  console.log(`- Nome: ${cvState.fullName}`);
  console.log(`- Email: ${cvState.email}`);
  console.log(`- Experiências: ${cvState.experience.length}`);
  console.log(`- Educação: ${cvState.education.length}`);
  console.log(`- Habilidades: ${cvState.skills.length}`);
  console.log(`- Certificações: ${cvState.certifications?.length || 0}`);

} catch (error) {
  console.error("\n❌ Erro:");
  console.error(error.message);
  if (error.response?.status) {
    console.error(`Status: ${error.response.status}`);
  }
}
